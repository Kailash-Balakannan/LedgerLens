import os
import sys
import pytest
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from database import test_db_connection as check_db_connection, initialize_database
from reconciliation import run_reconciliation, get_exception_detail, update_review

def test_exasol_connection():
    """Verify that Exasol DB connects and schema exists."""
    status = check_db_connection()
    assert status["connected"] is True, f"Exasol failed to connect: {status['error']}"
    assert status["version"] is not None

def test_initialization():
    """Verify application tables can be initialized without error."""
    initialize_database()

def test_default_reconciliation_kpis():
    """Verify default synthetic dataset metrics match known Exasol records."""
    res = run_reconciliation("DEFAULT")
    kpis = res["kpis"]
    
    assert kpis["total_bank_records"] == 6, f"Expected 6 bank records, got {kpis['total_bank_records']}"
    assert kpis["total_ledger_records"] == 6, f"Expected 6 ledger records, got {kpis['total_ledger_records']}"
    assert kpis["total_references"] == 7, f"Expected 7 distinct references, got {kpis['total_references']}"
    assert kpis["matched_references"] == 2, f"Expected 2 matches (REF1001, REF1003), got {kpis['matched_references']}"
    assert kpis["unresolved_exceptions"] == 5, f"Expected 5 exceptions, got {kpis['unresolved_exceptions']}"
    
    # Check category counts
    counts = res["category_counts"]
    assert counts["MATCHED"] == 2
    assert counts["AMOUNT_MISMATCH"] == 1
    assert counts["DUPLICATE_REFERENCE"] == 1
    assert counts["MISSING_FROM_LEDGER"] == 2
    assert counts["MISSING_FROM_BANK"] == 1

def test_specific_classifications():
    """Verify reference-level classifications from Exasol SQL."""
    res = run_reconciliation("DEFAULT")
    items_by_ref = {item["reference"]: item for item in res["items"]}

    # REF1001: Matched
    r1001 = items_by_ref["REF1001"]
    assert r1001["exception_category"] == "MATCHED"
    assert r1001["bank_amount"] == 1500.0
    assert r1001["ledger_amount"] == 1500.0
    assert r1001["variance"] == 0.0

    # REF1002: Amount mismatch
    r1002 = items_by_ref["REF1002"]
    assert r1002["exception_category"] == "AMOUNT_MISMATCH"
    assert r1002["bank_amount"] == 2500.0
    assert r1002["ledger_amount"] == 2300.0
    assert r1002["variance"] == 200.0
    assert "₹ 200.00" in r1002["intelligence"]["suggested_next_check"] or "200" in r1002["intelligence"]["suggested_next_check"]

    # REF1003: Matched
    r1003 = items_by_ref["REF1003"]
    assert r1003["exception_category"] == "MATCHED"
    assert r1003["bank_amount"] == 800.0
    assert r1003["ledger_amount"] == 800.0
    assert r1003["variance"] == 0.0

    # REF1004: Duplicate ledger reference
    r1004 = items_by_ref["REF1004"]
    assert r1004["exception_category"] == "DUPLICATE_REFERENCE"
    assert r1004["bank_count"] == 1
    assert r1004["ledger_count"] == 2
    assert len(r1004["ledger_records"]) == 2

    # REF1005: Missing from ledger
    r1005 = items_by_ref["REF1005"]
    assert r1005["exception_category"] == "MISSING_FROM_LEDGER"
    assert r1005["bank_count"] == 1
    assert r1005["ledger_count"] == 0
    assert r1005["variance"] == 600.0

    # REF1006: Missing from ledger
    r1006 = items_by_ref["REF1006"]
    assert r1006["exception_category"] == "MISSING_FROM_LEDGER"
    assert r1006["bank_count"] == 1
    assert r1006["ledger_count"] == 0
    assert r1006["variance"] == 950.0

    # REF1007: Missing from bank
    r1007 = items_by_ref["REF1007"]
    assert r1007["exception_category"] == "MISSING_FROM_BANK"
    assert r1007["bank_count"] == 0
    assert r1007["ledger_count"] == 1
    assert r1007["variance"] == -400.0

def test_review_workflow_persistence():
    """Verify updating a review persists to Exasol and appears in audit history."""
    update_res = update_review(
        run_id="DEFAULT",
        reference="REF1002",
        new_status="UNDER_INVESTIGATION",
        note="Contacted vendor accounts team regarding ₹200 fee variance.",
        reviewer_id="Test Auditor"
    )
    assert update_res["success"] is True

    # Check detail
    detail = get_exception_detail("DEFAULT", "REF1002")
    assert detail is not None
    assert detail["review_status"] == "UNDER_INVESTIGATION"
    assert len(detail["history"]) >= 1
    latest_hist = detail["history"][0]
    assert latest_hist["NEW_STATUS"] == "UNDER_INVESTIGATION"
    assert "₹200 fee variance" in latest_hist["NOTE"]
