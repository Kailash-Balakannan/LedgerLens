import os
import uuid
from decimal import Decimal
from typing import Dict, Any, List, Optional
import pandas as pd
from database import get_db_connection
from intelligence import generate_exception_intelligence

def get_reconciliation_sql(bank_table: str, bank_where: str, ledger_table: str, ledger_where: str, run_id: str, schema: str) -> str:
    """
    Constructs the pure Exasol SQL reconciliation query utilizing CTEs for safe aggregation
    before joining, eliminating Cartesian multiplication on duplicate references.
    """
    return f"""
    WITH bank_agg AS (
        SELECT 
            REFERENCE,
            COUNT(*) AS BANK_COUNT,
            SUM(AMOUNT) AS BANK_TOTAL_AMOUNT,
            MIN(AMOUNT) AS BANK_MIN_AMOUNT,
            MAX(AMOUNT) AS BANK_MAX_AMOUNT,
            MIN(TXN_DATE) AS BANK_MIN_DATE,
            MAX(TXN_DATE) AS BANK_MAX_DATE,
            MIN(CURRENCY) AS BANK_CURRENCY,
            COUNT(DISTINCT CURRENCY) AS BANK_CURRENCY_COUNT
        FROM {bank_table}
        {bank_where}
        GROUP BY REFERENCE
    ),
    ledger_agg AS (
        SELECT 
            REFERENCE,
            COUNT(*) AS LEDGER_COUNT,
            SUM(AMOUNT) AS LEDGER_TOTAL_AMOUNT,
            MIN(AMOUNT) AS LEDGER_MIN_AMOUNT,
            MAX(AMOUNT) AS LEDGER_MAX_AMOUNT,
            MIN(TXN_DATE) AS LEDGER_MIN_DATE,
            MAX(TXN_DATE) AS LEDGER_MAX_DATE,
            MIN(CURRENCY) AS LEDGER_CURRENCY,
            COUNT(DISTINCT CURRENCY) AS LEDGER_CURRENCY_COUNT
        FROM {ledger_table}
        {ledger_where}
        GROUP BY REFERENCE
    ),
    combined AS (
        SELECT 
            COALESCE(b.REFERENCE, l.REFERENCE) AS REFERENCE,
            COALESCE(b.BANK_COUNT, 0) AS BANK_COUNT,
            COALESCE(l.LEDGER_COUNT, 0) AS LEDGER_COUNT,
            COALESCE(b.BANK_TOTAL_AMOUNT, 0.00) AS BANK_AMOUNT,
            COALESCE(l.LEDGER_TOTAL_AMOUNT, 0.00) AS LEDGER_AMOUNT,
            (COALESCE(b.BANK_TOTAL_AMOUNT, 0.00) - COALESCE(l.LEDGER_TOTAL_AMOUNT, 0.00)) AS VARIANCE,
            COALESCE(b.BANK_CURRENCY, l.LEDGER_CURRENCY, 'INR') AS CURRENCY,
            CASE 
                WHEN b.BANK_CURRENCY_COUNT > 1 OR l.LEDGER_CURRENCY_COUNT > 1 THEN 0
                WHEN b.BANK_CURRENCY IS NOT NULL AND l.LEDGER_CURRENCY IS NOT NULL AND b.BANK_CURRENCY <> l.LEDGER_CURRENCY THEN 0
                ELSE 1
            END AS CURRENCIES_MATCH,
            b.BANK_MIN_DATE,
            b.BANK_MAX_DATE,
            l.LEDGER_MIN_DATE,
            l.LEDGER_MAX_DATE
        FROM bank_agg b
        FULL OUTER JOIN ledger_agg l ON b.REFERENCE = l.REFERENCE
    ),
    classified AS (
        SELECT 
            c.*,
            CASE
                -- 1. Currency conflict
                WHEN c.CURRENCIES_MATCH = 0 THEN 'CURRENCY_MISMATCH'
                
                -- 2. Missing from one source entirely
                WHEN c.BANK_COUNT > 0 AND c.LEDGER_COUNT = 0 THEN 'MISSING_FROM_LEDGER'
                WHEN c.BANK_COUNT = 0 AND c.LEDGER_COUNT > 0 THEN 'MISSING_FROM_BANK'
                
                -- 3. Duplicate references (>1 on either side)
                WHEN c.BANK_COUNT > 1 OR c.LEDGER_COUNT > 1 THEN 'DUPLICATE_REFERENCE'
                
                -- 4. Single record on each side with zero variance
                WHEN c.BANK_COUNT = 1 AND c.LEDGER_COUNT = 1 AND c.VARIANCE = 0 THEN 'MATCHED'
                
                -- 5. Single record on each side with non-zero variance
                WHEN c.BANK_COUNT = 1 AND c.LEDGER_COUNT = 1 AND c.VARIANCE <> 0 THEN 'AMOUNT_MISMATCH'
                
                ELSE 'AMBIGUOUS_EXCEPTION'
            END AS EXCEPTION_CATEGORY,
            CASE
                WHEN c.CURRENCIES_MATCH = 0 THEN 'Transaction records carry conflicting currencies.'
                WHEN c.BANK_COUNT > 0 AND c.LEDGER_COUNT = 0 THEN 'Bank record has no corresponding internal ledger entry.'
                WHEN c.BANK_COUNT = 0 AND c.LEDGER_COUNT > 0 THEN 'Internal ledger record has no corresponding bank statement entry.'
                WHEN c.BANK_COUNT > 1 AND c.LEDGER_COUNT = 1 THEN 'Multiple bank records share the same reference identifier.'
                WHEN c.BANK_COUNT = 1 AND c.LEDGER_COUNT > 1 THEN 'Multiple ledger records share the same reference identifier.'
                WHEN c.BANK_COUNT > 1 AND c.LEDGER_COUNT > 1 THEN 'Multiple records present on both bank and ledger sides.'
                WHEN c.BANK_COUNT = 1 AND c.LEDGER_COUNT = 1 AND c.VARIANCE = 0 THEN 'Single bank record matches single ledger record in reference, currency, and amount.'
                WHEN c.BANK_COUNT = 1 AND c.LEDGER_COUNT = 1 AND c.VARIANCE <> 0 THEN 'Single record on both sides, but amount differs between bank and ledger.'
                ELSE 'Unclassified discrepancy requiring investigation.'
            END AS EXCEPTION_REASON
        FROM combined c
    )
    SELECT 
        cl.REFERENCE,
        cl.BANK_COUNT,
        cl.LEDGER_COUNT,
        cl.BANK_AMOUNT,
        cl.LEDGER_AMOUNT,
        cl.VARIANCE,
        cl.CURRENCY,
        cl.CURRENCIES_MATCH,
        cl.EXCEPTION_CATEGORY,
        cl.EXCEPTION_REASON,
        COALESCE(r.REVIEW_STATUS, 'UNREVIEWED') AS REVIEW_STATUS,
        r.REVIEWER_NOTE,
        r.REVIEWER_ID,
        TO_CHAR(r.UPDATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS REVIEW_UPDATED_AT
    FROM classified cl
    LEFT JOIN {schema}.LEDGERLENS_REVIEWS r 
        ON r.RUN_ID = '{run_id}' AND r.REFERENCE = cl.REFERENCE
    ORDER BY 
        CASE cl.EXCEPTION_CATEGORY
            WHEN 'DUPLICATE_REFERENCE' THEN 1
            WHEN 'AMOUNT_MISMATCH' THEN 2
            WHEN 'MISSING_FROM_LEDGER' THEN 3
            WHEN 'MISSING_FROM_BANK' THEN 4
            WHEN 'CURRENCY_MISMATCH' THEN 5
            WHEN 'MATCHED' THEN 6
            ELSE 7
        END,
        ABS(cl.VARIANCE) DESC,
        cl.REFERENCE
    """

def run_reconciliation(run_id: str = "DEFAULT") -> Dict[str, Any]:
    """
    Executes reconciliation via Exasol SQL and enriches results with Exception Intelligence.
    """
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
    
    with get_db_connection() as conn:
        # Determine data sources
        if run_id == "DEFAULT":
            bank_table = f"{schema}.BANK_TRANSACTIONS"
            bank_where = ""
            ledger_table = f"{schema}.LEDGER_TRANSACTIONS"
            ledger_where = ""
            raw_bank_query = f"SELECT BANK_ID, REFERENCE, TO_CHAR(TXN_DATE, 'YYYY-MM-DD') AS TXN_DATE, AMOUNT, CURRENCY, DESCRIPTION FROM {schema}.BANK_TRANSACTIONS"
            raw_ledger_query = f"SELECT LEDGER_ID, REFERENCE, TO_CHAR(TXN_DATE, 'YYYY-MM-DD') AS TXN_DATE, AMOUNT, CURRENCY, DESCRIPTION FROM {schema}.LEDGER_TRANSACTIONS"
            run_type = "SYNTHETIC_DEFAULT"
            source_name = "Exasol Standard CloseWise Source"
        else:
            # Safe parameterized/sanitized run_id
            safe_run_id = "".join(c for c in run_id if c.isalnum() or c in ("-", "_"))
            bank_table = f"{schema}.LEDGERLENS_BANK_STAGING"
            bank_where = f"WHERE RUN_ID = '{safe_run_id}'"
            ledger_table = f"{schema}.LEDGERLENS_LEDGER_STAGING"
            ledger_where = f"WHERE RUN_ID = '{safe_run_id}'"
            raw_bank_query = f"SELECT BANK_ID, REFERENCE, TO_CHAR(TXN_DATE, 'YYYY-MM-DD') AS TXN_DATE, AMOUNT, CURRENCY, DESCRIPTION FROM {schema}.LEDGERLENS_BANK_STAGING WHERE RUN_ID = '{safe_run_id}'"
            raw_ledger_query = f"SELECT LEDGER_ID, REFERENCE, TO_CHAR(TXN_DATE, 'YYYY-MM-DD') AS TXN_DATE, AMOUNT, CURRENCY, DESCRIPTION FROM {schema}.LEDGERLENS_LEDGER_STAGING WHERE RUN_ID = '{safe_run_id}'"
            run_type = "CSV_UPLOAD"
            source_name = f"Uploaded Run {safe_run_id}"

        # 1. Execute reconciliation SQL
        sql = get_reconciliation_sql(bank_table, bank_where, ledger_table, ledger_where, run_id, schema)
        df_reconciled = conn.export_to_pandas(sql)

        # 2. Fetch raw bank and ledger records for evidence mapping
        df_bank_raw = conn.export_to_pandas(raw_bank_query)
        df_ledger_raw = conn.export_to_pandas(raw_ledger_query)

        # Build evidence lookup maps
        bank_evidence_map: Dict[str, List[Dict[str, Any]]] = {}
        for _, row in df_bank_raw.iterrows():
            ref = str(row["REFERENCE"])
            if ref not in bank_evidence_map:
                bank_evidence_map[ref] = []
            bank_evidence_map[ref].append(row.to_dict())

        ledger_evidence_map: Dict[str, List[Dict[str, Any]]] = {}
        for _, row in df_ledger_raw.iterrows():
            ref = str(row["REFERENCE"])
            if ref not in ledger_evidence_map:
                ledger_evidence_map[ref] = []
            ledger_evidence_map[ref].append(row.to_dict())

        # Determine maximum variance in dataset for relative scoring
        max_variance = Decimal("1.0")
        if not df_reconciled.empty:
            variances = [abs(Decimal(str(v))) for v in df_reconciled["VARIANCE"]]
            if variances:
                max_variance = max(max(variances), Decimal("1.0"))

        # Process reconciled rows and attach Exception Intelligence
        items = []
        category_counts = {
            "MATCHED": 0,
            "AMOUNT_MISMATCH": 0,
            "DUPLICATE_REFERENCE": 0,
            "MISSING_FROM_LEDGER": 0,
            "MISSING_FROM_BANK": 0,
            "CURRENCY_MISMATCH": 0,
            "AMBIGUOUS_EXCEPTION": 0
        }
        review_status_counts = {
            "UNREVIEWED": 0,
            "UNDER_INVESTIGATION": 0,
            "RESOLVED": 0,
            "ESCALATED": 0
        }
        
        amount_under_review = Decimal("0.00")
        total_bank_amount = Decimal("0.00")
        total_ledger_amount = Decimal("0.00")
        matched_count = 0

        for _, r in df_reconciled.iterrows():
            ref = str(r["REFERENCE"])
            b_count = int(r["BANK_COUNT"])
            l_count = int(r["LEDGER_COUNT"])
            b_amount = Decimal(str(r["BANK_AMOUNT"]))
            l_amount = Decimal(str(r["LEDGER_AMOUNT"]))
            variance = Decimal(str(r["VARIANCE"]))
            currency = str(r["CURRENCY"])
            cat = str(r["EXCEPTION_CATEGORY"])
            reason = str(r["EXCEPTION_REASON"])
            rev_status = str(r["REVIEW_STATUS"])

            total_bank_amount += b_amount
            total_ledger_amount += l_amount

            category_counts[cat] = category_counts.get(cat, 0) + 1
            review_status_counts[rev_status] = review_status_counts.get(rev_status, 0) + 1

            if cat == "MATCHED":
                matched_count += 1
            else:
                amount_under_review += abs(variance)

            b_ev = bank_evidence_map.get(ref, [])
            l_ev = ledger_evidence_map.get(ref, [])

            # Generate explainable Exception Intelligence
            intel = generate_exception_intelligence(
                category=cat,
                reference=ref,
                bank_count=b_count,
                ledger_count=l_count,
                bank_amount=b_amount,
                ledger_amount=l_amount,
                variance=variance,
                currency=currency,
                bank_records=b_ev,
                ledger_records=l_ev,
                max_dataset_variance=max_variance
            )

            items.append({
                "reference": ref,
                "bank_count": b_count,
                "ledger_count": l_count,
                "bank_amount": float(b_amount),
                "ledger_amount": float(l_amount),
                "variance": float(variance),
                "currency": currency,
                "exception_category": cat,
                "exception_reason": reason,
                "review_status": rev_status,
                "reviewer_note": r["REVIEWER_NOTE"] if pd.notna(r["REVIEWER_NOTE"]) else None,
                "reviewer_id": r["REVIEWER_ID"] if pd.notna(r["REVIEWER_ID"]) else None,
                "review_updated_at": r["REVIEW_UPDATED_AT"] if pd.notna(r["REVIEW_UPDATED_AT"]) else None,
                "bank_records": b_ev,
                "ledger_records": l_ev,
                "intelligence": intel
            })

        total_references = len(items)
        unresolved_exceptions = total_references - matched_count
        recon_rate = round((matched_count / total_references * 100), 1) if total_references > 0 else 0.0

        # Run metadata
        run_info = conn.export_to_pandas(f"""
            SELECT RUN_ID, RUN_TYPE, SOURCE_NAME, BANK_RECORD_COUNT, LEDGER_RECORD_COUNT,
                   TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
            FROM {schema}.LEDGERLENS_RUNS
            WHERE RUN_ID = '{run_id}'
        """)
        created_at = run_info["CREATED_AT"].iloc[0] if not run_info.empty else "N/A"

        return {
            "run_id": run_id,
            "run_type": run_type,
            "source_name": source_name,
            "created_at": str(created_at),
            "kpis": {
                "total_bank_records": len(df_bank_raw),
                "total_ledger_records": len(df_ledger_raw),
                "total_references": total_references,
                "matched_references": matched_count,
                "unresolved_exceptions": unresolved_exceptions,
                "reconciliation_rate": recon_rate,
                "amount_under_review": float(amount_under_review),
                "total_bank_amount": float(total_bank_amount),
                "total_ledger_amount": float(total_ledger_amount)
            },
            "category_counts": category_counts,
            "review_status_counts": review_status_counts,
            "items": items
        }

def get_exception_detail(run_id: str, reference: str) -> Optional[Dict[str, Any]]:
    """Fetches in-depth evidence and review history for a specific reference."""
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
    full_data = run_reconciliation(run_id)
    item = next((i for i in full_data["items"] if i["reference"] == reference), None)
    if not item:
        return None

    with get_db_connection() as conn:
        safe_run_id = "".join(c for c in run_id if c.isalnum() or c in ("-", "_"))
        safe_ref = reference.replace("'", "''")
        history_df = conn.export_to_pandas(f"""
            SELECT 
                HISTORY_ID, OLD_STATUS, NEW_STATUS, NOTE, REVIEWER_ID,
                TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
            FROM {schema}.LEDGERLENS_REVIEW_HISTORY
            WHERE RUN_ID = '{safe_run_id}' AND REFERENCE = '{safe_ref}'
            ORDER BY CREATED_AT DESC
        """)
        history = history_df.to_dict(orient="records") if not history_df.empty else []

    item["history"] = history
    return item

def update_review(run_id: str, reference: str, new_status: str, note: Optional[str], reviewer_id: str = "Finance Ops Reviewer") -> Dict[str, Any]:
    """
    Persists reviewer status changes and audit log notes into Exasol.
    Ensures state survives page reloads and maintains historical audit trail.
    """
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
    safe_run_id = "".join(c for c in run_id if c.isalnum() or c in ("-", "_"))
    safe_ref = reference.replace("'", "''")
    safe_note = (note or "").replace("'", "''")
    safe_reviewer = (reviewer_id or "Finance Ops Reviewer").replace("'", "''")
    history_id = f"REV-{uuid.uuid4().hex[:12].upper()}"

    with get_db_connection() as conn:
        # 1. Fetch current status
        curr = conn.export_to_pandas(f"""
            SELECT REVIEW_STATUS FROM {schema}.LEDGERLENS_REVIEWS
            WHERE RUN_ID = '{safe_run_id}' AND REFERENCE = '{safe_ref}'
        """)
        old_status = curr["REVIEW_STATUS"].iloc[0] if not curr.empty else "UNREVIEWED"

        # 2. Update/Insert in LEDGERLENS_REVIEWS
        conn.execute(f"""
            DELETE FROM {schema}.LEDGERLENS_REVIEWS
            WHERE RUN_ID = '{safe_run_id}' AND REFERENCE = '{safe_ref}'
        """)
        conn.execute(f"""
            INSERT INTO {schema}.LEDGERLENS_REVIEWS (RUN_ID, REFERENCE, REVIEW_STATUS, REVIEWER_NOTE, REVIEWER_ID, UPDATED_AT)
            VALUES ('{safe_run_id}', '{safe_ref}', '{new_status}', '{safe_note}', '{safe_reviewer}', CURRENT_TIMESTAMP)
        """)

        # 3. Append to Audit Trail in LEDGERLENS_REVIEW_HISTORY
        conn.execute(f"""
            INSERT INTO {schema}.LEDGERLENS_REVIEW_HISTORY (HISTORY_ID, RUN_ID, REFERENCE, OLD_STATUS, NEW_STATUS, NOTE, REVIEWER_ID, CREATED_AT)
            VALUES ('{history_id}', '{safe_run_id}', '{safe_ref}', '{old_status}', '{new_status}', '{safe_note}', '{safe_reviewer}', CURRENT_TIMESTAMP)
        """)

    return {
        "success": True,
        "run_id": run_id,
        "reference": reference,
        "old_status": old_status,
        "new_status": new_status,
        "note": note,
        "reviewer_id": reviewer_id
    }
