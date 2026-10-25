import os
import io
import csv
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from reconciliation import run_reconciliation
from database import get_db_connection

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.get("/csv")
def export_reconciliation_csv(run_id: str = Query("DEFAULT")):
    """Exports the complete reconciliation summary and classification breakdown as a CSV file."""
    try:
        data = run_reconciliation(run_id)
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "REFERENCE",
            "BANK_COUNT",
            "LEDGER_COUNT",
            "BANK_AMOUNT",
            "LEDGER_AMOUNT",
            "VARIANCE",
            "CURRENCY",
            "EXCEPTION_CATEGORY",
            "PRIORITY_SCORE",
            "PRIORITY_LABEL",
            "REVIEW_STATUS",
            "REVIEWER_NOTE",
            "SUGGESTED_NEXT_CHECK"
        ])

        for item in data["items"]:
            writer.writerow([
                item["reference"],
                item["bank_count"],
                item["ledger_count"],
                f"{item['bank_amount']:.2f}",
                f"{item['ledger_amount']:.2f}",
                f"{item['variance']:.2f}",
                item["currency"],
                item["exception_category"],
                item["intelligence"]["priority_score"],
                item["intelligence"]["priority_label"],
                item["review_status"],
                item.get("reviewer_note") or "",
                item["intelligence"]["suggested_next_check"]
            ])

        return PlainTextResponse(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=reconciliation_{run_id}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/audit")
def export_audit_log_csv(run_id: str = Query("DEFAULT")):
    """Exports the complete persistent review decision audit trail as a CSV file."""
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
    safe_run_id = "".join(c for c in run_id if c.isalnum() or c in ("-", "_"))

    try:
        with get_db_connection() as conn:
            df = conn.export_to_pandas(f"""
                SELECT 
                    HISTORY_ID, RUN_ID, REFERENCE, OLD_STATUS, NEW_STATUS, NOTE, REVIEWER_ID,
                    TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS TIMESTAMP
                FROM {schema}.LEDGERLENS_REVIEW_HISTORY
                WHERE RUN_ID = '{safe_run_id}'
                ORDER BY CREATED_AT DESC
            """)
            
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return PlainTextResponse(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=audit_log_{run_id}.csv"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit export failed: {str(e)}")
