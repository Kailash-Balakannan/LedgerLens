import React, { useState } from 'react';
import { uploadAndReconcile } from '../../api';
import type { RunInfo, ReconciliationResponse } from '../../types';
import { UploadCloud, CheckCircle2, AlertCircle, Download, RefreshCw, Database } from 'lucide-react';

interface ReconciliationWorkspaceProps {
  currentRunId: string;
  runs: RunInfo[];
  onSelectRun: (runId: string) => void;
  onUploadSuccess: (result: ReconciliationResponse) => void;
}

export const ReconciliationWorkspace: React.FC<ReconciliationWorkspaceProps> = ({
  currentRunId,
  runs,
  onSelectRun,
  onUploadSuccess
}) => {
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBankFile(e.target.files[0]);
      setErrors([]);
    }
  };

  const handleLedgerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLedgerFile(e.target.files[0]);
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankFile || !ledgerFile) {
      setErrors(['Please select both Bank Statement CSV and Internal Ledger CSV files.']);
      return;
    }

    setUploading(true);
    setErrors([]);
    try {
      const result = await uploadAndReconcile(bankFile, ledgerFile);
      onUploadSuccess(result);
      setBankFile(null);
      setLedgerFile(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to upload and reconcile files.';
      setErrors(msg.split(' | '));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Run Selection & Data Context Bar */}
      <div className="p-4 rounded-2xl bg-ink-900 border border-ink-700/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cobalt-400" />
            <span className="text-xs font-mono font-semibold uppercase text-ink-300">
              Active Reconciliation Dataset:
            </span>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cobalt-500/10 text-cobalt-300 border border-cobalt-500/30 font-bold">
              {currentRunId}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Reconciliation runs execute directly on Exasol tables. Source records remain strictly isolated.
          </p>
        </div>

        {/* Switch Run Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-400 font-mono">Switch Run:</label>
          <select
            value={currentRunId}
            onChange={(e) => onSelectRun(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-ink-850 border border-ink-700 text-xs text-ink-200 focus:outline-none focus:border-cobalt-400 font-mono cursor-pointer"
          >
            {runs.map((r) => (
              <option key={r.RUN_ID} value={r.RUN_ID}>
                {r.RUN_ID} ({r.RUN_TYPE === 'SYNTHETIC_DEFAULT' ? 'Standard 6-Record Synthetic' : r.SOURCE_NAME})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CSV Upload Studio */}
      <div className="p-6 rounded-2xl bg-ink-900 border border-ink-700/80 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-ink-800 gap-3">
          <div>
            <h3 className="font-display font-semibold text-base text-ink-100 tracking-tight">
              Ingest & Reconcile Batch Datasets
            </h3>
            <p className="text-xs text-ink-400 mt-0.5">
              Upload matching pairs of CSV files. LedgerLens validates required fields, stages records into Exasol, and runs SQL reconciliation.
            </p>
          </div>

          {/* Sample CSV Downloads */}
          <div className="flex items-center gap-2">
            <a
              href="/api/upload/samples/bank"
              download="sample_bank_statement.csv"
              className="px-3 py-1.5 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-700 text-xs text-ink-300 hover:text-ink-100 flex items-center gap-1.5 transition-colors font-mono"
            >
              <Download className="w-3.5 h-3.5 text-cobalt-400" />
              <span>Sample Bank CSV</span>
            </a>
            <a
              href="/api/upload/samples/ledger"
              download="sample_internal_ledger.csv"
              className="px-3 py-1.5 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-700 text-xs text-ink-300 hover:text-ink-100 flex items-center gap-1.5 transition-colors font-mono"
            >
              <Download className="w-3.5 h-3.5 text-tealmatch-light" />
              <span>Sample Ledger CSV</span>
            </a>
          </div>
        </div>

        {/* Validation Errors Alert */}
        {errors.length > 0 && (
          <div className="p-4 mb-6 rounded-xl bg-redcrit-bg border border-redcrit-border text-redcrit-light text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Validation Issues Detected:</span>
            </div>
            {errors.map((err, i) => (
              <div key={`err-${i}`} className="pl-5 text-[11px] leading-relaxed">
                • {err}
              </div>
            ))}
          </div>
        )}

        {/* Upload Dropzones */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Statement Dropzone */}
            <div className="p-5 rounded-xl bg-ink-850/80 border border-dashed border-cobalt-500/40 flex flex-col items-center justify-center text-center relative group hover:border-cobalt-400 transition-colors">
              <UploadCloud className="w-8 h-8 text-cobalt-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-semibold text-ink-100 uppercase tracking-wider">
                1. Bank Transactions File
              </span>
              <p className="text-[11px] text-ink-400 mt-1 max-w-xs">
                Expected columns: <code className="text-cobalt-300 font-mono">REFERENCE</code>, <code className="text-cobalt-300 font-mono">TXN_DATE</code>, <code className="text-cobalt-300 font-mono">AMOUNT</code>, <code className="text-cobalt-300 font-mono">CURRENCY</code>
              </p>

              <label className="mt-3 px-4 py-2 rounded-xl bg-cobalt-500/10 hover:bg-cobalt-500/20 border border-cobalt-500/30 text-cobalt-300 text-xs font-semibold cursor-pointer transition-colors">
                <span>{bankFile ? bankFile.name : 'Choose Bank CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBankChange}
                  className="hidden"
                />
              </label>

              {bankFile && (
                <div className="flex items-center gap-1 text-[11px] text-tealmatch-light mt-2 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready ({(bankFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* Ledger Transactions Dropzone */}
            <div className="p-5 rounded-xl bg-ink-850/80 border border-dashed border-tealmatch-border flex flex-col items-center justify-center text-center relative group hover:border-tealmatch-light transition-colors">
              <UploadCloud className="w-8 h-8 text-tealmatch-light mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-semibold text-ink-100 uppercase tracking-wider">
                2. Internal Ledger File
              </span>
              <p className="text-[11px] text-ink-400 mt-1 max-w-xs">
                Expected columns: <code className="text-tealmatch-light font-mono">REFERENCE</code>, <code className="text-tealmatch-light font-mono">TXN_DATE</code>, <code className="text-tealmatch-light font-mono">AMOUNT</code>, <code className="text-tealmatch-light font-mono">DESCRIPTION</code>
              </p>

              <label className="mt-3 px-4 py-2 rounded-xl bg-tealmatch-bg hover:bg-tealmatch-bg/80 border border-tealmatch-border text-tealmatch-light text-xs font-semibold cursor-pointer transition-colors">
                <span>{ledgerFile ? ledgerFile.name : 'Choose Ledger CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleLedgerChange}
                  className="hidden"
                />
              </label>

              {ledgerFile && (
                <div className="flex items-center gap-1 text-[11px] text-tealmatch-light mt-2 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready ({(ledgerFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-ink-500 font-mono">
              Protected against SQL injection and binary floating point inaccuracies.
            </span>

            <button
              type="submit"
              disabled={uploading || !bankFile || !ledgerFile}
              className="px-6 py-2.5 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 disabled:opacity-40 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
              <span>{uploading ? 'Reconciling in Exasol...' : 'Execute Exasol Reconciliation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
