# 🔍 LedgerLens — ExaThon India 2026
> **Track 01: Money, Risk & Regulation**  
> *“Every discrepancy has a story. Find the evidence behind it.”*

[![Exasol](https://img.shields.io/badge/Database-Exasol%20Personal%202026-004B87?logo=database)](https://www.exasol.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20PyExasol-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![GSAP](https://img.shields.io/badge/Motion-GSAP-88CE02?logo=greensock)](https://gsap.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Product Overview

**LedgerLens** is a financial reconciliation web application built for finance operations and audit teams. Rather than a black-box system or an AI chatbot pretending to detect fraud, LedgerLens serves as an **evidence-driven investigative workspace**.

### The Core Problem
Finance teams routinely reconcile thousands of bank transactions against internal accounting ledgers. When differences appear, reviewers face critical questions:
- Which transactions match?
- Which records do not match, and by how much?
- Are duplicate reference keys present?
- Is a transaction missing from the bank statement or internal ledger?
- What evidence supports the exception classification?
- What should the reviewer inspect next?
- Who reviewed the exception, what decision was made, and why?

LedgerLens answers each question with verifiable data from **Exasol SQL**, generating explainable **Exception Intelligence** and maintaining a permanent audit trail.

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   LedgerLens Web Client                     │
│    (React 19, TypeScript, Tailwind CSS, GSAP Choreography)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Engine                   │
│   • Input Validation (Pandas)  • Decimal-safe calculations   │
│   • Exception Intelligence     • Audit Logging Route Handlers│
└──────────────────────────────┬──────────────────────────────┘
                               │ PyExasol (TLS WebSockets)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Exasol Personal DB                      │
│   • CLOSEWISE.BANK_TRANSACTIONS (Source of truth)          │
│   • CLOSEWISE.LEDGER_TRANSACTIONS (Source of truth)        │
│   • CLOSEWISE.LEDGERLENS_BANK_STAGING (Isolated runs)       │
│   • CLOSEWISE.LEDGERLENS_LEDGER_STAGING (Isolated runs)     │
│   • CLOSEWISE.LEDGERLENS_REVIEWS (Review state persistence) │
│   • CLOSEWISE.LEDGERLENS_REVIEW_HISTORY (Audit trail)       │
└─────────────────────────────────────────────────────────────┘
```

### Real Analytical Work in Exasol SQL
Reconciliation runs through pure Exasol SQL with Common Table Expressions (CTEs):
1. **Independent Pre-Aggregation:** Bank records and Ledger records are aggregated independently by `REFERENCE` before joining, preventing Cartesian join inflation when duplicate references exist.
2. **Full Outer Join:** Combines aggregated sides without dropping unilateral records.
3. **Deterministic Classification:**
   - **`MATCHED`:** 1 bank record, 1 ledger record, identical currency, zero variance.
   - **`AMOUNT_MISMATCH`:** 1 bank record, 1 ledger record, identical currency, non-zero variance.
   - **`DUPLICATE_REFERENCE`:** Bank count > 1 OR Ledger count > 1.
   - **`MISSING_FROM_LEDGER`:** Bank count > 0, Ledger count = 0.
   - **`MISSING_FROM_BANK`:** Bank count = 0, Ledger count > 0.
   - **`CURRENCY_MISMATCH`:** Conflicting ISO currency codes.
4. **Permanent Review Persistence:** Review states (`UNDER_INVESTIGATION`, `RESOLVED`, `ESCALATED`) and notes persist to Exasol and survive browser reloads.

---

## 3. Verified Synthetic Dataset

The system connects to the existing Exasol database (`CLOSEWISE` schema) containing six bank transactions and six ledger transactions:

| Reference | Bank Side | Ledger Side | Variance | Classification | Ground Truth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REF1001** | ₹ 1,500.00 (1 txn) | ₹ 1,500.00 (1 txn) | ₹ 0.00 | `MATCHED` | Exact match |
| **REF1002** | ₹ 2,500.00 (1 txn) | ₹ 2,300.00 (1 txn) | +₹ 200.00 | `AMOUNT_MISMATCH` | ₹200 variance under review |
| **REF1003** | ₹ 800.00 (1 txn) | ₹ 800.00 (1 txn) | ₹ 0.00 | `MATCHED` | Exact match |
| **REF1004** | ₹ 1,200.00 (1 txn) | ₹ 2,400.00 (2 txns) | -₹ 1,200.00 | `DUPLICATE_REFERENCE` | Duplicate ledger entry detected |
| **REF1005** | ₹ 600.00 (1 txn) | *None* (0 txns) | +₹ 600.00 | `MISSING_FROM_LEDGER` | Direct debit service charge missing in ledger |
| **REF1006** | ₹ 950.00 (1 txn) | *None* (0 txns) | +₹ 950.00 | `MISSING_FROM_LEDGER` | Vendor payment missing in ledger |
| **REF1007** | *None* (0 txns) | ₹ 400.00 (1 txn) | -₹ 400.00 | `MISSING_FROM_BANK` | Internal adjustment unpresented at bank |

---

## 4. Exception Intelligence & Priority Scoring

Every discrepancy generates an explainable audit card:
- **Expected State:** What standard settlement required.
- **Observed State:** What Exasol records proved.
- **Discrepancy Analysis:** Net direction and magnitude of difference.
- **Evidence Trail:** Exact Transaction IDs, dates, descriptions, and amounts.
- **Suggested Next Check:** Rules-based, non-judgmental guidance (e.g. check fee deduction, verify batch timing, inspect duplicate entry).
- **Deterministic Priority Score (0–100):**
  $$\text{Score} = \text{Category Weight} + \text{Relative Magnitude Weight} + \text{Multiplicity Weight} + \text{Evidence Check}$$
  No black-box ML or LLM hallucinations. All scoring factors are transparently explained in the UI.

---

## 5. Motion Design System (GSAP)

- **Welcome Sequence:** Animated geometric transaction records resolving into a single reconciliation lens.
- **Signature Reconciliation Graph:** Interactive topological SVG diagram mapping bank nodes to ledger nodes with animated Bezier curves.
- **Staggered KPI Counters:** GSAP orchestrated entrance.
- **Investigation Drawer:** Smooth slide-out inspection drawer preserving table scroll position.
- **Accessibility:** Fully honors `prefers-reduced-motion` with instant transitions when enabled.

---

## 6. Installation & Quick Start (Windows PowerShell)

### Prerequisites
1. **Python 3.11+** installed.
2. **Node.js 20+** and **npm** installed.
3. **Exasol Personal** running locally on `127.0.0.1:8563`.
   *(If Exasol is in Podman, ensure the container `exasol-db-*` is started: `wsl -d podman-machine-default -u root -e podman start <container-id>`)*

---

### Step 1: Clone & Configure Environment

```powershell
# Navigate to the project root
cd c:\backup\projects\LedgeLens

# Copy environment template
Copy-Item backend\.env.example backend\.env
```

Open `backend\.env` and ensure credentials match your Exasol instance:
```env
EXASOL_DSN=127.0.0.1:8563
EXASOL_USER=sys
EXASOL_PASSWORD=your_password_here
EXASOL_SCHEMA=CLOSEWISE
EXASOL_ENCRYPTION=True
```
*(Note: If `EXASOL_PASSWORD` is omitted, the connector automatically falls back to your local `~/.exasol/personal/deployments/default/secrets.json`)*

---

### Step 2: Install Backend Dependencies & Run Tests

```powershell
# Install backend requirements
& "C:\Users\balak\AppData\Local\Python\bin\python.exe" -m pip install -r backend\requirements.txt

# Run automated tests against live Exasol SQL
& "C:\Users\balak\AppData\Local\Python\bin\python.exe" -m pytest backend\tests\ -v
```

---

### Step 3: Start Backend API Server

In PowerShell Terminal 1:
```powershell
cd c:\backup\projects\LedgeLens\backend
& "C:\Users\balak\AppData\Local\Python\bin\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*API will be available at `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.*

---

### Step 4: Start Frontend Client

In PowerShell Terminal 2:
```powershell
cd c:\backup\projects\LedgeLens\frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```
*Open your browser at `http://127.0.0.1:5173/`.*

---

## 7. Automated Test Suite

Run the full automated test suite covering Exasol connectivity, DDL initialization, SQL CTE reconciliation, and API endpoints:

```powershell
& "C:\Users\balak\AppData\Local\Python\bin\python.exe" -m pytest backend\tests\ -v
```

Test coverage includes:
- `test_exasol_connection`: Verifies TLS WebSocket connection to Exasol.
- `test_initialization`: Verifies safe `CREATE TABLE IF NOT EXISTS` execution without touching source tables.
- `test_default_reconciliation_kpis`: Validates 6 bank, 6 ledger, 7 references, 2 matches, 5 exceptions.
- `test_specific_classifications`: Tests exact amounts, variances, and duplicate detection.
- `test_review_workflow_persistence`: Tests review status persistence and historical audit log in Exasol.
- `test_root_endpoint`, `test_health_endpoint`, `test_reconciliation_endpoint`, `test_single_exception_endpoint`, `test_sample_csv_endpoints`, `test_review_submission`.

---

## 8. Demo Video Script (3 Minutes Max)

- **[0:00 – 0:30] Introduction & Problem Statement:**
  *“Finance teams lose hundreds of hours reconciling bank statements against internal ledgers. When numbers don’t match, teams need evidence, not vague alerts. Welcome to LedgerLens, built for ExaThon India 2026.”*
- **[0:30 – 1:15] Overview Dashboard & Signature Visualization:**
  *“Here is our Executive Overview connected directly to Exasol Personal. Notice our Signature Reconciliation Graph: bank records on the left, ledger on the right. Notice how REF1001 connects cleanly in teal as a verified match, REF1002 highlights a ₹200 variance in amber, and REF1004 branches into two ledger entries, catching a duplicate entry before amounts are inflated.”*
- **[1:15 – 2:00] Exception Intelligence & Investigation Drawer:**
  *“Clicking REF1002 slides open our Investigation Drawer. LedgerLens extracts both source records directly from Exasol. Under Exception Intelligence, it details the expected state, observed state, net variance of ₹200, and suggests checking for processing fees. Notice our transparent priority score of 47 with exact breakdown factors.”*
- **[2:00 – 2:30] Review Workflow & Persistence:**
  *“As a reviewer, I can mark this as ‘Under Investigation’, record my notes, and hit ‘Save Decision’. This is stored directly in Exasol table `LEDGERLENS_REVIEWS`. If I refresh the page, the decision remains intact, and an entry is permanently logged in our Audit Trail.”*
- **[2:30 – 3:00] Ingestion Studio & Conclusion:**
  *“In the Ingestion Studio, users can upload custom pairs of CSV files. LedgerLens validates the schema, isolates records into staging tables, and executes SQL reconciliation. LedgerLens turns financial uncertainty into an explainable result. Thank you.”*

---

## 9. Concise Pitch Outline

- **Headline:** LedgerLens — Evidence-Driven Financial Reconciliation on Exasol.
- **Track:** Track 01: Money, Risk & Regulation.
- **Core Value:** Eliminates the guesswork in bank-to-ledger discrepancies with verifiable SQL-backed evidence and permanent auditability.
- **Differentiator:** Deterministic Exception Intelligence with transparent scoring instead of ungrounded AI fraud probability.
- **Database Role:** Exasol handles analytical joins, duplicate detection, variance calculations, and audit persistence without data movement.

---

## 10. Disclosed Limitations & Future Roadmap

- **Multi-Tenant Access Control:** Currently uses a demo reviewer identity (`Finance Ops Reviewer`). Future versions will support RBAC and SSO.
- **Fuzzy Reference Matching:** Currently matches strictly on reference keys. Future releases will support probabilistic rule-guided matching for reference typos.
- **Automated ERP Webhooks:** Staging currently supports CSV uploads and Exasol source tables; future roadmap includes automated webhook triggers from NetSuite and SAP.

---

## 11. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
