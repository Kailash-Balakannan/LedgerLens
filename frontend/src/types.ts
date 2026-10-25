export type ExceptionCategory =
  | 'MATCHED'
  | 'AMOUNT_MISMATCH'
  | 'DUPLICATE_REFERENCE'
  | 'MISSING_FROM_LEDGER'
  | 'MISSING_FROM_BANK'
  | 'CURRENCY_MISMATCH'
  | 'AMBIGUOUS_EXCEPTION';

export type ReviewStatus =
  | 'UNREVIEWED'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED'
  | 'ESCALATED';

export interface RawTransaction {
  BANK_ID?: string;
  LEDGER_ID?: string;
  REFERENCE: string;
  TXN_DATE: string;
  AMOUNT: number;
  CURRENCY: string;
  DESCRIPTION: string;
}

export interface ExceptionIntelligence {
  expected: string;
  observed: string;
  difference: string;
  evidence: string[];
  suggested_next_check: string;
  priority_score: number;
  priority_label: 'HIGH' | 'MEDIUM' | 'LOW' | 'RESOLVED / NONE';
  priority_breakdown: Record<string, string>;
}

export interface ReconciliationItem {
  reference: string;
  bank_count: number;
  ledger_count: number;
  bank_amount: number;
  ledger_amount: number;
  variance: number;
  currency: string;
  exception_category: ExceptionCategory;
  exception_reason: string;
  review_status: ReviewStatus;
  reviewer_note: string | null;
  reviewer_id: string | null;
  review_updated_at: string | null;
  bank_records: RawTransaction[];
  ledger_records: RawTransaction[];
  intelligence: ExceptionIntelligence;
  history?: AuditLogEntry[];
}

export interface KPIs {
  total_bank_records: number;
  total_ledger_records: number;
  total_references: number;
  matched_references: number;
  unresolved_exceptions: number;
  reconciliation_rate: number;
  amount_under_review: number;
  total_bank_amount: number;
  total_ledger_amount: number;
}

export interface ReconciliationResponse {
  run_id: string;
  run_type: string;
  source_name: string;
  created_at: string;
  kpis: KPIs;
  category_counts: Record<string, number>;
  review_status_counts: Record<string, number>;
  items: ReconciliationItem[];
}

export interface RunInfo {
  RUN_ID: string;
  RUN_TYPE: string;
  SOURCE_NAME: string;
  BANK_RECORD_COUNT: number;
  LEDGER_RECORD_COUNT: number;
  CREATED_AT: string;
}

export interface AuditLogEntry {
  HISTORY_ID: string;
  RUN_ID?: string;
  REFERENCE: string;
  OLD_STATUS: ReviewStatus;
  NEW_STATUS: ReviewStatus;
  NOTE: string;
  REVIEWER_ID: string;
  CREATED_AT: string;
}

export interface DbHealth {
  status: 'healthy' | 'degraded';
  latency_ms: number;
  database: {
    connected: boolean;
    dsn: string;
    schema: string;
    version: string | null;
    error: string | null;
  };
  app_name: string;
  edition: string;
}
