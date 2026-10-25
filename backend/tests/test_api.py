import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["product"] == "LedgerLens"
    assert data["status"] == "operational"

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "database" in data
    assert data["database"]["connected"] is True

def test_reconciliation_endpoint():
    res = client.get("/api/reconciliation?run_id=DEFAULT")
    assert res.status_code == 200
    data = res.json()
    assert data["run_id"] == "DEFAULT"
    assert data["kpis"]["total_references"] == 7
    assert data["kpis"]["matched_references"] == 2
    assert len(data["items"]) == 7

def test_single_exception_endpoint():
    res = client.get("/api/reconciliation/exception/REF1002?run_id=DEFAULT")
    assert res.status_code == 200
    data = res.json()
    assert data["reference"] == "REF1002"
    assert data["exception_category"] == "AMOUNT_MISMATCH"
    assert "intelligence" in data
    assert data["intelligence"]["priority_score"] > 0

def test_sample_csv_endpoints():
    res_bank = client.get("/api/upload/samples/bank")
    assert res_bank.status_code == 200
    assert "BANK_ID" in res_bank.text

    res_ledger = client.get("/api/upload/samples/ledger")
    assert res_ledger.status_code == 200
    assert "LEDGER_ID" in res_ledger.text

def test_review_submission():
    payload = {
        "run_id": "DEFAULT",
        "reference": "REF1004",
        "new_status": "ESCALATED",
        "note": "Escalated duplicate ledger entry to senior accounting team.",
        "reviewer_id": "QA Tester"
    }
    res = client.post("/api/reviews", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["new_status"] == "ESCALATED"

    # Verify history
    hist_res = client.get("/api/reviews/history?run_id=DEFAULT")
    assert hist_res.status_code == 200
    history = hist_res.json()["history"]
    assert any(h["REFERENCE"] == "REF1004" and h["NEW_STATUS"] == "ESCALATED" for h in history)
