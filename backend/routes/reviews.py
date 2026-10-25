import os
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query
from reconciliation import update_review
from database import get_db_connection

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

class ReviewUpdateRequest(BaseModel):
    run_id: str = Field(default="DEFAULT", description="Reconciliation Run Identifier")
    reference: str = Field(..., description="Transaction Reference Identifier")
    new_status: str = Field(..., description="New review status: UNREVIEWED, UNDER_INVESTIGATION, RESOLVED, ESCALATED")
    note: Optional[str] = Field(default=None, description="Reviewer explanation or note")
    reviewer_id: Optional[str] = Field(default="Finance Ops Reviewer", description="Identifier of reviewer")

@router.post("")
def set_review_status(body: ReviewUpdateRequest):
    """
    Updates the review status and records note into Exasol.
    Persists decision permanently to survive page reloads and logs into audit history.
    """
    valid_statuses = {"UNREVIEWED", "UNDER_INVESTIGATION", "RESOLVED", "ESCALATED"}
    if body.new_status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid review status '{body.new_status}'. Allowed values: {sorted(list(valid_statuses))}"
        )

    try:
        res = update_review(
            run_id=body.run_id,
            reference=body.reference,
            new_status=body.new_status,
            note=body.note,
            reviewer_id=body.reviewer_id or "Finance Ops Reviewer"
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist review status in Exasol: {str(e)}")

@router.get("/history")
def get_run_audit_history(run_id: str = Query("DEFAULT", description="Reconciliation Run Identifier")):
    """Returns the full audit trail of review actions for the specified run."""
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
    safe_run_id = "".join(c for c in run_id if c.isalnum() or c in ("-", "_"))
    try:
        with get_db_connection() as conn:
            df = conn.export_to_pandas(f"""
                SELECT 
                    HISTORY_ID, REFERENCE, OLD_STATUS, NEW_STATUS, NOTE, REVIEWER_ID,
                    TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
                FROM {schema}.LEDGERLENS_REVIEW_HISTORY
                WHERE RUN_ID = '{safe_run_id}'
                ORDER BY CREATED_AT DESC
            """)
            history = df.to_dict(orient="records") if not df.empty else []
            return {"run_id": run_id, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit history from Exasol: {str(e)}")
