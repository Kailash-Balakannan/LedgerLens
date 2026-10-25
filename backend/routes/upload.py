import os
import io
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Tuple
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import PlainTextResponse
import pandas as pd
from database import get_db_connection
from reconciliation import run_reconciliation

router = APIRouter(prefix="/api/upload", tags=["Upload"])

COLUMN_SYNONYMS = {
    "id": ["bank_id", "ledger_id", "transaction_id", "txn_id", "id", "reference_id"],
    "reference": ["reference", "ref", "ref_id", "ref_no", "invoice_no", "cheque_no"],
    "txn_date": ["txn_date", "date", "transaction_date", "posting_date", "value_date"],
    "amount": ["amount", "amt", "value", "total", "net_amount"],
    "currency": ["currency", "ccy", "curr"],
    "description": ["description", "desc", "narration", "memo", "remarks", "details"]
}

def map_and_validate_csv(content_bytes: bytes, source_type: str) -> Tuple[pd.DataFrame, List[str]]:
    """
    Validates CSV file structure, maps column synonyms, and ensures decimal-safe amounts and valid dates.
    """
    errors: List[str] = []
    if not content_bytes or len(content_bytes.strip()) == 0:
        return pd.DataFrame(), [f"{source_type} file is empty."]

    try:
        # Decode UTF-8 or Latin-1
        try:
            text = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = content_bytes.decode("latin-1")
            
        df = pd.read_csv(io.StringIO(text), dtype=str)
    except Exception as e:
        return pd.DataFrame(), [f"Failed to parse {source_type} as valid CSV: {str(e)}"]

    if df.empty:
        return pd.DataFrame(), [f"{source_type} CSV contains headers but no transaction records."]

    # Normalize column names to lowercase stripped
    cols = {c.strip().lower(): c for c in df.columns}
    mapped_cols: Dict[str, str] = {}

    for standard_name, synonyms in COLUMN_SYNONYMS.items():
        found = False
        for syn in synonyms:
            if syn in cols:
                mapped_cols[standard_name] = cols[syn]
                found = True
                break

    # Required fields check
    required = ["reference", "txn_date", "amount"]
    for req in required:
        if req not in mapped_cols:
            return pd.DataFrame(), [
                f"{source_type} CSV is missing mandatory column: '{req}'. Detected columns: {list(df.columns)}"
            ]

    # Map ID column or generate synthetic ID if omitted
    id_col = mapped_cols.get("id")
    id_prefix = "B" if source_type == "Bank" else "L"

    clean_records = []
    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-based index including header
        
        # Reference validation
        ref = str(row[mapped_cols["reference"]]).strip() if pd.notna(row[mapped_cols["reference"]]) else ""
        if not ref or ref.lower() in ("nan", "none", "null"):
            errors.append(f"{source_type} row {row_num}: Missing reference value.")
            continue

        # Date validation
        raw_date = str(row[mapped_cols["txn_date"]]).strip()
        try:
            parsed_date = pd.to_datetime(raw_date).strftime("%Y-%m-%d")
        except Exception:
            errors.append(f"{source_type} row {row_num}: Invalid date format '{raw_date}'. Expected YYYY-MM-DD or standard date.")
            continue

        # Amount validation (decimal safe)
        raw_amount = str(row[mapped_cols["amount"]]).replace(",", "").replace("$", "").replace("₹", "").strip()
        try:
            amt_dec = Decimal(raw_amount)
            if amt_dec < 0:
                amt_dec = abs(amt_dec)  # Use absolute transaction magnitude
        except Exception:
            errors.append(f"{source_type} row {row_num}: Invalid numeric amount '{raw_amount}'.")
            continue

        # Currency
        curr = "INR"
        if "currency" in mapped_cols and pd.notna(row[mapped_cols["currency"]]):
            c_val = str(row[mapped_cols["currency"]]).strip().upper()
            if c_val:
                curr = c_val[:10]

        # Description
        desc = f"{source_type} transaction"
        if "description" in mapped_cols and pd.notna(row[mapped_cols["description"]]):
            desc = str(row[mapped_cols["description"]]).strip()[:250]

        # ID
        txn_id = f"{id_prefix}{row_num:03d}"
        if id_col and pd.notna(row[id_col]) and str(row[id_col]).strip():
            txn_id = str(row[id_col]).strip()[:40]

        clean_records.append({
            "id": txn_id,
            "reference": ref,
            "txn_date": parsed_date,
            "amount": float(amt_dec),
            "currency": curr,
            "description": desc
        })

    if errors:
        return pd.DataFrame(), errors

    return pd.DataFrame(clean_records), []

@router.post("")
async def upload_and_reconcile(
    bank_file: UploadFile = File(...),
    ledger_file: UploadFile = File(...)
):
    """
    Validates uploaded Bank and Ledger CSV files, stages them safely into Exasol tables
    under an isolated run_id, and executes Exasol SQL reconciliation.
    """
    bank_bytes = await bank_file.read()
    ledger_bytes = await ledger_file.read()

    df_bank, bank_errors = map_and_validate_csv(bank_bytes, "Bank")
    df_ledger, ledger_errors = map_and_validate_csv(ledger_bytes, "Ledger")

    all_errors = bank_errors + ledger_errors
    if all_errors:
        raise HTTPException(status_code=400, detail={"errors": all_errors})

    # Generate unique run ID
    run_id = f"RUN-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")

    try:
        with get_db_connection() as conn:
            # 1. Register Run
            source_name = f"Bank: {bank_file.filename} | Ledger: {ledger_file.filename}"
            conn.execute(f"""
                INSERT INTO {schema}.LEDGERLENS_RUNS 
                (RUN_ID, RUN_TYPE, SOURCE_NAME, BANK_RECORD_COUNT, LEDGER_RECORD_COUNT, CREATED_AT)
                VALUES ('{run_id}', 'CSV_UPLOAD', '{source_name}', {len(df_bank)}, {len(df_ledger)}, CURRENT_TIMESTAMP)
            """)

            # 2. Stage Bank Records safely
            bank_stage_df = pd.DataFrame({
                "RUN_ID": run_id,
                "BANK_ID": df_bank["id"],
                "REFERENCE": df_bank["reference"],
                "TXN_DATE": df_bank["txn_date"],
                "AMOUNT": df_bank["amount"],
                "CURRENCY": df_bank["currency"],
                "DESCRIPTION": df_bank["description"]
            })
            conn.import_from_pandas(bank_stage_df, (schema, "LEDGERLENS_BANK_STAGING"))

            # 3. Stage Ledger Records safely
            ledger_stage_df = pd.DataFrame({
                "RUN_ID": run_id,
                "LEDGER_ID": df_ledger["id"],
                "REFERENCE": df_ledger["reference"],
                "TXN_DATE": df_ledger["txn_date"],
                "AMOUNT": df_ledger["amount"],
                "CURRENCY": df_ledger["currency"],
                "DESCRIPTION": df_ledger["description"]
            })
            conn.import_from_pandas(ledger_stage_df, (schema, "LEDGERLENS_LEDGER_STAGING"))

        # 4. Trigger reconciliation on this isolated run in Exasol SQL
        result = run_reconciliation(run_id)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute Exasol staging and reconciliation: {str(e)}")

@router.get("/samples/bank")
def get_sample_bank_csv():
    """Provides a sample bank statement CSV formatted for LedgerLens."""
    csv_data = """BANK_ID,REFERENCE,TXN_DATE,AMOUNT,CURRENCY,DESCRIPTION
B001,REF1001,2026-10-20,1500.00,INR,Customer payment settlement
B002,REF1002,2026-10-20,2500.00,INR,Supplier payment remittance
B003,REF1003,2026-10-21,800.00,INR,Refund clearance
B004,REF1004,2026-10-21,1200.00,INR,Customer payment batch
B005,REF1005,2026-10-22,600.00,INR,Direct debit service charge
B006,REF1006,2026-10-22,950.00,INR,Vendor automated disbursement
"""
    return PlainTextResponse(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample_bank_statement.csv"})

@router.get("/samples/ledger")
def get_sample_ledger_csv():
    """Provides a sample internal ledger CSV formatted for LedgerLens."""
    csv_data = """LEDGER_ID,REFERENCE,TXN_DATE,AMOUNT,CURRENCY,DESCRIPTION
L001,REF1001,2026-10-20,1500.00,INR,Customer payment journal
L002,REF1002,2026-10-20,2300.00,INR,Supplier payment voucher
L003,REF1003,2026-10-21,800.00,INR,Refund approval voucher
L004,REF1004,2026-10-21,1200.00,INR,Customer invoice settlement
L005,REF1004,2026-10-21,1200.00,INR,Duplicate ledger entry
L006,REF1007,2026-10-22,400.00,INR,Internal expense accrual
"""
    return PlainTextResponse(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample_internal_ledger.csv"})
