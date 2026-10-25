import time
from fastapi import APIRouter
from database import test_db_connection

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("")
def check_health():
    """Returns database health, connection latency, and version information."""
    start_time = time.time()
    db_status = test_db_connection()
    latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "healthy" if db_status["connected"] else "degraded",
        "database": db_status,
        "latency_ms": latency_ms,
        "app_name": "LedgerLens Financial Reconciliation Engine",
        "edition": "ExaThon India 2026 Edition"
    }
