from decimal import Decimal
from typing import List, Dict, Any, Optional

def generate_exception_intelligence(
    category: str,
    reference: str,
    bank_count: int,
    ledger_count: int,
    bank_amount: Decimal,
    ledger_amount: Decimal,
    variance: Decimal,
    currency: str,
    bank_records: List[Dict[str, Any]],
    ledger_records: List[Dict[str, Any]],
    max_dataset_variance: Decimal = Decimal("1.0")
) -> Dict[str, Any]:
    """
    Generates deterministic, transparent, and evidence-grounded Exception Intelligence.
    Strictly avoids unsubstantiated fraud claims, returning defensible audit observations.
    """
    var_float = float(variance)
    abs_var = abs(var_float)
    b_amt = float(bank_amount)
    l_amt = float(ledger_amount)
    max_var_float = float(max_dataset_variance) if float(max_dataset_variance) > 0 else 1.0

    evidence_items: List[str] = []
    for b in bank_records:
        evidence_items.append(
            f"Bank ID {b.get('BANK_ID', 'N/A')}: {b.get('TXN_DATE', 'N/A')} | {currency} {float(b.get('AMOUNT', 0)):,.2f} | {b.get('DESCRIPTION', 'N/A')}"
        )
    for l in ledger_records:
        evidence_items.append(
            f"Ledger ID {l.get('LEDGER_ID', 'N/A')}: {l.get('TXN_DATE', 'N/A')} | {currency} {float(l.get('AMOUNT', 0)):,.2f} | {l.get('DESCRIPTION', 'N/A')}"
        )

    # 1. Expected State
    if category == "MATCHED":
        expected = f"One bank statement posting and one ledger entry with reference {reference}, matching amount of {currency} {b_amt:,.2f}."
    elif category == "AMOUNT_MISMATCH":
        expected = f"Bank statement amount to equal ledger entry amount exactly ({currency} {b_amt:,.2f} vs {currency} {l_amt:,.2f})."
    elif category == "DUPLICATE_REFERENCE":
        expected = f"A single unique transaction per reference identifier ({reference}) across both bank and ledger records."
    elif category == "MISSING_FROM_LEDGER":
        expected = f"Bank transaction {reference} of {currency} {b_amt:,.2f} to be recorded in internal ledger records."
    elif category == "MISSING_FROM_BANK":
        expected = f"Ledger entry {reference} of {currency} {l_amt:,.2f} to appear on the bank statement within settlement cutoff."
    elif category == "CURRENCY_MISMATCH":
        expected = f"Consistent ISO currency code between bank and ledger records for reference {reference}."
    else:
        expected = f"Standard 1-to-1 reference correspondence with zero variance."

    # 2. Observed State
    if category == "MATCHED":
        observed = f"1 bank record ({currency} {b_amt:,.2f}) and 1 ledger record ({currency} {l_amt:,.2f}) matched identically."
    elif category == "AMOUNT_MISMATCH":
        observed = f"1 bank record ({currency} {b_amt:,.2f}) and 1 ledger record ({currency} {l_amt:,.2f}) found with differing amounts."
    elif category == "DUPLICATE_REFERENCE":
        observed = f"Found {bank_count} bank record(s) (totaling {currency} {b_amt:,.2f}) and {ledger_count} ledger record(s) (totaling {currency} {l_amt:,.2f}) sharing reference {reference}."
    elif category == "MISSING_FROM_LEDGER":
        observed = f"1 bank statement entry ({currency} {b_amt:,.2f}) present, but 0 corresponding ledger entries found."
    elif category == "MISSING_FROM_BANK":
        observed = f"1 internal ledger record ({currency} {l_amt:,.2f}) posted, but 0 corresponding bank statement records found."
    elif category == "CURRENCY_MISMATCH":
        observed = f"Records found on both sides, but transaction currencies do not match."
    else:
        observed = f"Observed {bank_count} bank record(s) and {ledger_count} ledger record(s)."

    # 3. What is Different
    if category == "MATCHED":
        difference = f"Zero variance. Reference, currency, and value match perfectly."
    elif category == "AMOUNT_MISMATCH":
        diff_direction = "higher than" if var_float > 0 else "lower than"
        difference = f"Net variance of {currency} {abs_var:,.2f} (Bank is {diff_direction} Ledger)."
    elif category == "DUPLICATE_REFERENCE":
        difference = f"Ambiguous reference: {ledger_count} ledger records vs {bank_count} bank record(s), causing combined variance of {currency} {var_float:,.2f}."
    elif category == "MISSING_FROM_LEDGER":
        difference = f"Unmatched bank credit/debit of {currency} {b_amt:,.2f}. Ledger is missing this record entirely."
    elif category == "MISSING_FROM_BANK":
        difference = f"Unmatched internal ledger posting of {currency} {l_amt:,.2f}. Bank statement has no matching clearance."
    else:
        difference = f"Variance of {currency} {var_float:,.2f} between bank and ledger totals."

    # 4. Suggested Next Check (Rules-based, specific, non-judgmental)
    if category == "MATCHED":
        suggested_next_check = "No action required. Transaction is verified and reconciled."
    elif category == "AMOUNT_MISMATCH":
        if abs_var < 500:
            suggested_next_check = f"Confirm whether the {currency} {abs_var:,.2f} variance is caused by bank processing fees, remittance charges, withholding tax, or a data-entry typo."
        else:
            suggested_next_check = f"Inspect source invoice and bank statement receipt to verify whether a partial payment was received or an incorrect billing amount was entered."
    elif category == "DUPLICATE_REFERENCE":
        suggested_next_check = f"Review the {ledger_count} ledger entries to identify if one is an accidental duplicate voucher, an unreversed correction, or a legitimate split installment."
    elif category == "MISSING_FROM_LEDGER":
        suggested_next_check = f"Check unposted journal entries or treasury suspense accounts for reference {reference} to create the appropriate ledger voucher."
    elif category == "MISSING_FROM_BANK":
        suggested_next_check = f"Verify whether the payment has cleared at the bank, was cancelled/voided, or if the clearing cutoff falls in the following statement period."
    elif category == "CURRENCY_MISMATCH":
        suggested_next_check = f"Verify if an FX conversion occurred or if the bank account was billed in foreign currency."
    else:
        suggested_next_check = f"Review transaction documents and audit logs for reference {reference}."

    # 5. Transparent Review Priority Scoring (0 - 100)
    score_breakdown = {}
    total_score = 0

    if category == "MATCHED":
        total_score = 0
        score_breakdown["category_weight"] = 0
        score_breakdown["magnitude_weight"] = 0
        score_breakdown["multiplicity_weight"] = 0
    else:
        # Category base score
        if category == "DUPLICATE_REFERENCE":
            cat_score = 35
            cat_reason = "Duplicate reference creates double-posting and balance ambiguity (+35)"
        elif category == "AMOUNT_MISMATCH":
            cat_score = 30
            cat_reason = "Direct discrepancy between confirmed bank settlement and ledger book (+30)"
        elif category == "MISSING_FROM_LEDGER":
            cat_score = 25
            cat_reason = "Bank cash movement without internal record poses unrecorded liability/asset (+25)"
        elif category == "MISSING_FROM_BANK":
            cat_score = 20
            cat_reason = "Internal voucher not yet reflected in bank statement (+20)"
        else:
            cat_score = 20
            cat_reason = "Unclassified exception requiring standard audit review (+20)"
        total_score += cat_score
        score_breakdown["category"] = cat_reason

        # Magnitude score (up to 40 pts)
        mag_ratio = min(1.0, abs_var / max_var_float) if max_var_float > 0 else 0.5
        mag_score = int(round(mag_ratio * 40))
        total_score += mag_score
        score_breakdown["magnitude"] = f"Variance relative to dataset maximum ({currency} {abs_var:,.2f} / {currency} {max_var_float:,.2f}) (+{mag_score})"

        # Multiplicity score (up to 15 pts)
        mult_score = 0
        if bank_count > 1 or ledger_count > 1:
            mult_score = 15
            score_breakdown["multiplicity"] = f"Multiple associated records ({bank_count} bank, {ledger_count} ledger) (+15)"
        else:
            score_breakdown["multiplicity"] = "Single record per side (+0)"
        total_score += mult_score

        # Evidence Completeness check (10 pts)
        if len(evidence_items) > 0:
            total_score += 10
            score_breakdown["evidence"] = "Verified records retrieved from Exasol source (+10)"

    final_score = min(100, max(0, total_score))
    
    # Priority classification
    if final_score >= 70:
        priority_label = "HIGH"
    elif final_score >= 40:
        priority_label = "MEDIUM"
    elif final_score > 0:
        priority_label = "LOW"
    else:
        priority_label = "RESOLVED / NONE"

    return {
        "expected": expected,
        "observed": observed,
        "difference": difference,
        "evidence": evidence_items,
        "suggested_next_check": suggested_next_check,
        "priority_score": final_score,
        "priority_label": priority_label,
        "priority_breakdown": score_breakdown
    }
