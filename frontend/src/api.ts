import type { ReconciliationResponse, DbHealth, RunInfo, AuditLogEntry, ReviewStatus, ReconciliationItem } from './types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<DbHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchReconciliation(runId: string = 'DEFAULT'): Promise<ReconciliationResponse> {
  const res = await fetch(`${API_BASE}/reconciliation?run_id=${encodeURIComponent(runId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Reconciliation request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchRuns(): Promise<RunInfo[]> {
  const res = await fetch(`${API_BASE}/reconciliation/runs`);
  if (!res.ok) {
    throw new Error(`Failed to fetch runs (${res.status})`);
  }
  const data = await res.json();
  return data.runs || [];
}

export async function fetchExceptionDetail(runId: string, reference: string): Promise<ReconciliationItem> {
  const res = await fetch(`${API_BASE}/reconciliation/exception/${encodeURIComponent(reference)}?run_id=${encodeURIComponent(runId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch exception detail for ${reference}`);
  }
  return res.json();
}

export async function uploadAndReconcile(bankFile: File, ledgerFile: File): Promise<ReconciliationResponse> {
  const formData = new FormData();
  formData.append('bank_file', bankFile);
  formData.append('ledger_file', ledgerFile);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (errorData.detail && errorData.detail.errors) {
      throw new Error(errorData.detail.errors.join(' | '));
    }
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export async function submitReview(
  runId: string,
  reference: string,
  newStatus: ReviewStatus,
  note: string,
  reviewerId: string = 'Finance Ops Reviewer'
): Promise<any> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      run_id: runId,
      reference,
      new_status: newStatus,
      note,
      reviewer_id: reviewerId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit review (${res.status})`);
  }

  return res.json();
}

export async function fetchAuditHistory(runId: string = 'DEFAULT'): Promise<AuditLogEntry[]> {
  const res = await fetch(`${API_BASE}/reviews/history?run_id=${encodeURIComponent(runId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch audit history (${res.status})`);
  }
  const data = await res.json();
  return data.history || [];
}
