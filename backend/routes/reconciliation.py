import os
from fastapi import APIRouter, HTTPException, Query
from reconciliation import run_reconciliation, get_exception_detail
from database import get_db_connection

router = APIRouter(prefix="/api/reconciliation", tags=["Reconciliation"])

@router.get("")
def get_reconciliation_summary(run_id: str = Query("DEFAULT", description="Reconciliation Run Identifier")):
    """
    Executes and returns reference-level reconciliation results powered by Exasol SQL.
    Includes KPI metrics, category breakdowns, and Exception Intelligence.
    """
    try:
        return run_reconciliation(run_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reconciliation error in Exasol engine: {str(e)}")

@router.get("/runs")
def list_reconciliation_runs():
    """Returns all available reconciliation runs (default synthetic and uploaded batches)."""
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
    try:
        with get_db_connection() as conn:
            df = conn.export_to_pandas(f"""
                SELECT 
                    RUN_ID, RUN_TYPE, SOURCE_NAME, BANK_RECORD_COUNT, LEDGER_RECORD_COUNT,
                    TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
                FROM {schema}.LEDGERLENS_RUNS
                ORDER BY CREATED_AT DESC
            """)
            runs = df.to_dict(orient="records") if not df.empty else []
            return {"runs": runs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query reconciliation runs: {str(e)}")

@router.get("/exception/{reference}")
def get_single_exception(
    reference: str, 
    run_id: str = Query("DEFAULT", description="Reconciliation Run Identifier")
):
    """Fetches in-depth evidence and audit history for a specific reference exception."""
    try:
        detail = get_exception_detail(run_id, reference)
        if not detail:
            raise HTTPException(status_code=404, detail=f"Reference '{reference}' not found in run '{run_id}'")
        return detail
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch exception detail: {str(e)}")
