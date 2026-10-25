import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOTS_DIR = PROJECT_ROOT / "test_reports" / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

def run_browser_e2e():
    print("=" * 70)
    print("STARTING LEDGERLENS BROWSER END-TO-END QA VIA PLAYWRIGHT")
    print("=" * 70)

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        
        # Ensure fresh state for first visit
        context.add_init_script("localStorage.removeItem('ledgerlens_welcomed')")
        
        page = context.new_page()

        # Capture console messages and errors
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE ERROR] {err}"))

        # -------------------------------------------------------------
        # STEP 1: Welcome Entrance Motion & Core Promise
        # -------------------------------------------------------------
        print("\n[Step 1] Testing Welcome Reveal Sequence...")
        page.goto("http://127.0.0.1:5173")
        page.wait_for_load_state("domcontentloaded")

        # Check for welcome text or enter dashboard button
        enter_btn = page.locator("button:has-text('Enter Dashboard')")
        expect(enter_btn).to_be_visible(timeout=8000)
        
        welcome_screenshot = SCREENSHOTS_DIR / "01_welcome_reveal.png"
        page.screenshot(path=str(welcome_screenshot))
        print(f"  ✓ Welcome screen verified. Screenshot: {welcome_screenshot.name}")

        # Click 'Enter Dashboard' to smoothly transition
        enter_btn.click()
        page.wait_for_timeout(1000)
        results.append(("Welcome Reveal Sequence", "PASS"))

        # -------------------------------------------------------------
        # STEP 2: Dashboard Overview & Sourced Exasol Data
        # -------------------------------------------------------------
        print("\n[Step 2] Testing Dashboard Overview & Exasol Sourced KPIs...")
        expect(page.locator("text=Signature Reconciliation Graph")).to_be_visible(timeout=10000)

        # Verify Exasol Connection Pill
        expect(page.locator("text=Exasol DB")).to_be_visible()

        # Verify KPI values
        expect(page.locator("text=Matched References")).to_be_visible()
        expect(page.locator("text=Unresolved Exceptions")).to_be_visible()
        expect(page.locator("text=Amount Under Review")).to_be_visible()
        expect(page.locator("text=₹ 3,350.00")).to_be_visible()

        dash_screenshot = SCREENSHOTS_DIR / "02_dashboard_overview.png"
        page.screenshot(path=str(dash_screenshot))
        print(f"  ✓ Dashboard loaded with real Exasol KPIs (₹ 3,350.00 under review). Screenshot: {dash_screenshot.name}")
        results.append(("Dashboard Overview & KPI Board", "PASS"))

        # -------------------------------------------------------------
        # STEP 3: Signature Reconciliation Graph & Exception Selection
        # -------------------------------------------------------------
        print("\n[Step 3] Testing Interactive Reconciliation Graph & Drawer Opening...")
        # Locate node with REF1002
        ref1002_node = page.locator("text=REF1002").first
        expect(ref1002_node).to_be_visible()
        ref1002_node.click()

        # Investigation drawer should slide in
        expect(page.locator("text=Reconciliation Variance")).to_be_visible(timeout=5000)
        expect(page.locator("text=Verified Source Records in Exasol")).to_be_visible()
        expect(page.locator("text=Bank Statement (1)")).to_be_visible()
        expect(page.locator("text=Internal Ledger (1)")).to_be_visible()
        expect(page.locator("text=Exception Intelligence & Audit Analysis")).to_be_visible()

        drawer_screenshot = SCREENSHOTS_DIR / "03_investigation_drawer_REF1002.png"
        page.screenshot(path=str(drawer_screenshot))
        print(f"  ✓ Investigation Drawer opened for REF1002. Screenshot: {drawer_screenshot.name}")
        results.append(("Interactive Graph & Investigation Drawer", "PASS"))

        # -------------------------------------------------------------
        # STEP 4: Review Decision Submission & Persistence
        # -------------------------------------------------------------
        print("\n[Step 4] Testing Review Submission & Persistence in Exasol...")
        # Select 'Investigating' status
        page.locator("button:has-text('Investigating')").click()

        timestamp_str = time.strftime('%H:%M:%S')
        test_note = f"Automated E2E QA note at {timestamp_str}: Verified INR 200 variance."
        textarea = page.locator("textarea[placeholder*='Explain the finding']")
        textarea.fill(test_note)

        # Click 'Save Decision'
        page.locator("button:has-text('Save Decision')").click()
        expect(page.locator("text=Review decision and explanatory note saved permanently to Exasol")).to_be_visible(timeout=15000)
        print("  ✓ Success banner displayed.")

        # Check that note appears in the review history inside drawer
        page.wait_for_timeout(1000)
        expect(page.locator("p.italic").filter(has_text=test_note)).to_be_visible(timeout=10000)
        print("  ✓ Audit History updated inside drawer.")

        # Close drawer using X button
        page.locator("button[aria-label='Close drawer']").click()
        page.wait_for_timeout(1000)

        # Reload page to verify persistence across browser refresh
        print("  Verifying persistence across page refresh...")
        page.reload()
        page.wait_for_load_state("networkidle")

        # Open REF1002 again
        page.locator("text=REF1002").first.click()
        expect(page.locator("text=Reconciliation Variance")).to_be_visible(timeout=8000)
        expect(page.locator("p.italic").filter(has_text=test_note)).to_be_visible(timeout=8000)

        persisted_screenshot = SCREENSHOTS_DIR / "04_persisted_review_after_reload.png"
        page.screenshot(path=str(persisted_screenshot))
        print(f"  ✓ Review decision persisted across refresh! Screenshot: {persisted_screenshot.name}")
        results.append(("Review Decision Persistence", "PASS"))

        # Close drawer
        page.locator("button[aria-label='Close drawer']").click()
        page.wait_for_timeout(1000)

        # -------------------------------------------------------------
        # STEP 5: Exceptions Table Queue & Filtering
        # -------------------------------------------------------------
        print("\n[Step 5] Testing Exceptions Table View & Category Filters...")
        page.locator("button:has-text('Exceptions Queue')").click()
        expect(page.locator("table")).to_be_visible(timeout=8000)
        expect(page.locator("text=Showing 7 of 7 references")).to_be_visible()

        # Search for REF1004
        search_input = page.locator("input[placeholder*='Search reference']")
        search_input.fill("REF1004")
        page.wait_for_timeout(300)
        expect(page.locator("table").locator("text=Duplicate Reference")).to_be_visible()
        search_input.fill("")
        page.wait_for_timeout(300)

        # Filter by AMOUNT_MISMATCH dropdown
        category_select = page.locator("select").first
        category_select.select_option("AMOUNT_MISMATCH")
        page.wait_for_timeout(300)
        expect(page.locator("table").locator("text=REF1002")).to_be_visible()
        # Reset to ALL
        category_select.select_option("ALL")
        page.wait_for_timeout(300)

        table_screenshot = SCREENSHOTS_DIR / "05_exceptions_table.png"
        page.screenshot(path=str(table_screenshot))
        print(f"  ✓ Exceptions Queue verified. Screenshot: {table_screenshot.name}")
        results.append(("Exceptions Table & Filtering", "PASS"))

        # -------------------------------------------------------------
        # STEP 6: Ingestion Studio - Invalid Input Error Handling
        # -------------------------------------------------------------
        print("\n[Step 6] Testing Ingestion Studio & Invalid CSV Validation...")
        page.locator("button:has-text('Ingestion Studio')").click()
        expect(page.locator("text=Ingest & Reconcile Batch Datasets")).to_be_visible()

        # Create temporary invalid CSV files
        invalid_bank = SCREENSHOTS_DIR / "bad_bank.csv"
        invalid_bank.write_text("SOME_COL,ANOTHER_COL\nfoo,bar\n")
        invalid_ledger = SCREENSHOTS_DIR / "empty_ledger.csv"
        invalid_ledger.write_text("")

        # Upload invalid files using file inputs
        file_inputs = page.locator("input[type='file']")
        file_inputs.nth(0).set_input_files(str(invalid_bank))
        file_inputs.nth(1).set_input_files(str(invalid_ledger))

        # Click 'Execute Exasol Reconciliation'
        page.locator("button:has-text('Execute Exasol Reconciliation')").click()

        # Check for understandable validation error alerts
        expect(page.locator("text=Validation Issues Detected")).to_be_visible(timeout=5000)
        expect(page.locator("text=Ledger file is empty")).to_be_visible()
        expect(page.locator("text=Bank CSV is missing mandatory column: 'reference'")).to_be_visible()

        invalid_screenshot = SCREENSHOTS_DIR / "06_invalid_csv_validation_alert.png"
        page.screenshot(path=str(invalid_screenshot))
        print(f"  ✓ Understandable error alert shown for invalid CSVs. Screenshot: {invalid_screenshot.name}")
        results.append(("Invalid CSV Error Handling", "PASS"))

        # -------------------------------------------------------------
        # STEP 7: Ingestion Studio - Valid CSV Upload & Run Switching
        # -------------------------------------------------------------
        print("\n[Step 7] Testing Valid Dual CSV Upload & Isolated Run Creation...")
        valid_bank = SCREENSHOTS_DIR / "valid_bank.csv"
        valid_bank.write_text("""BANK_ID,REFERENCE,TXN_DATE,AMOUNT,CURRENCY,DESCRIPTION
VB001,REF2001,2026-10-25,5000.00,INR,Enterprise client deposit
VB002,REF2002,2026-10-25,12000.00,INR,Vendor payment remittance
""")
        valid_ledger = SCREENSHOTS_DIR / "valid_ledger.csv"
        valid_ledger.write_text("""LEDGER_ID,REFERENCE,TXN_DATE,AMOUNT,CURRENCY,DESCRIPTION
VL001,REF2001,2026-10-25,5000.00,INR,Enterprise client journal
VL002,REF2002,2026-10-25,11500.00,INR,Vendor payment voucher
""")

        file_inputs.nth(0).set_input_files(str(valid_bank))
        file_inputs.nth(1).set_input_files(str(valid_ledger))
        page.locator("button:has-text('Execute Exasol Reconciliation')").click()

        # Should redirect back to Overview with the new run active
        page.wait_for_timeout(3000)
        expect(page.locator("text=Signature Reconciliation Graph")).to_be_visible(timeout=15000)

        # Check new run items in overview
        expect(page.locator("text=REF2001").first).to_be_visible()
        expect(page.locator("text=REF2002").first).to_be_visible()

        new_run_screenshot = SCREENSHOTS_DIR / "07_new_run_reconciliation.png"
        page.screenshot(path=str(new_run_screenshot))
        print(f"  ✓ Uploaded CSV staged & reconciled in Exasol! Screenshot: {new_run_screenshot.name}")
        results.append(("Valid Dual CSV Upload & Staging", "PASS"))

        # Switch back to DEFAULT run
        print("  Switching back to DEFAULT synthetic run...")
        page.locator("button:has-text('Ingestion Studio')").click()
        page.wait_for_timeout(500)
        run_select = page.locator("select").first
        run_select.select_option("DEFAULT")
        page.wait_for_timeout(1000)
        page.locator("button:has-text('Overview')").click()
        page.wait_for_timeout(1000)
        expect(page.locator("text=REF1001").first).to_be_visible(timeout=10000)
        print("  ✓ Successfully switched back to DEFAULT run.")
        results.append(("Run Switching & Isolation", "PASS"))

        # -------------------------------------------------------------
        # STEP 8: Audit History Modal & CSV Export
        # -------------------------------------------------------------
        print("\n[Step 8] Testing Audit Log Modal & CSV Export...")
        # Open Audit Modal (History icon in header)
        page.locator("button[title*='audit log']").click()
        expect(page.locator("text=Audit Trail & Review Decision History")).to_be_visible(timeout=8000)
        expect(page.locator("text=Dataset Run: DEFAULT")).to_be_visible()

        audit_screenshot = SCREENSHOTS_DIR / "08_audit_log_modal.png"
        page.screenshot(path=str(audit_screenshot))
        print(f"  ✓ Audit modal verified. Screenshot: {audit_screenshot.name}")
        results.append(("Audit Log Modal", "PASS"))

        # Close modal
        page.locator("button[aria-label='Close audit log']").click()
        page.wait_for_timeout(500)

        # Check Export CSV button href
        export_btn = page.locator("a:has-text('Export CSV')").first
        expect(export_btn).to_be_visible()
        href = export_btn.get_attribute("href")
        assert "/api/export/csv" in href
        print(f"  ✓ Export CSV link verified: {href}")
        results.append(("CSV Export Trigger", "PASS"))

        browser.close()

    print("\n" + "=" * 70)
    print("BROWSER E2E TEST SUMMARY")
    print("=" * 70)
    for name, status in results:
        print(f"  [{status}] {name}")
    print("=" * 70)

if __name__ == "__main__":
    run_browser_e2e()
