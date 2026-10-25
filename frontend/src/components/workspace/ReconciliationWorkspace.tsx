import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadAndReconcile } from '../../api';
import type { RunInfo, ReconciliationResponse } from '../../types';
import { UploadCloud, AlertCircle, Download, RefreshCw, Database, FileSpreadsheet } from 'lucide-react';
import { useReducedMotion } from '../../motion/useReducedMotion';

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
  const [isBankDragging, setIsBankDragging] = useState(false);
  const [isLedgerDragging, setIsLedgerDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const prefersReduced = useReducedMotion();

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

  const handleBankDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsBankDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setBankFile(e.dataTransfer.files[0]);
      setErrors([]);
    }
  };

  const handleLedgerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLedgerDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setLedgerFile(e.dataTransfer.files[0]);
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
          <p className="text-xs text-ink-400 mt-1">
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
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-4 mb-6 rounded-xl bg-redcrit-bg border border-redcrit-border text-redcrit-light text-xs space-y-1.5"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Validation Issues Detected:</span>
              </div>
              {errors.map((err, i) => (
                <div key={`err-${i}`} className="pl-5 text-[11px] leading-relaxed">
                  • {err}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Dropzones */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Statement Dropzone */}
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setIsBankDragging(true); }}
              onDragLeave={() => setIsBankDragging(false)}
              onDrop={handleBankDrop}
              animate={{
                scale: isBankDragging ? 1.02 : 1,
                borderColor: isBankDragging ? '#60A5FA' : 'rgba(37,99,235,0.4)'
              }}
              className={`p-6 rounded-xl bg-ink-850/80 border border-dashed flex flex-col items-center justify-center text-center relative transition-all ${
                isBankDragging ? 'bg-cobalt-500/10 shadow-glow' : 'hover:border-cobalt-400'
              }`}
            >
              <UploadCloud className={`w-8 h-8 mb-2 transition-transform ${isBankDragging ? 'scale-110 text-cobalt-300' : 'text-cobalt-400'}`} />
              <span className="text-xs font-mono font-semibold text-ink-100 uppercase tracking-wider">
                1. Bank Transactions File
              </span>
              <p className="text-[11px] text-ink-400 mt-1 max-w-xs">
                Expected columns: <code className="text-cobalt-300 font-mono">REFERENCE</code>, <code className="text-cobalt-300 font-mono">TXN_DATE</code>, <code className="text-cobalt-300 font-mono">AMOUNT</code>, <code className="text-cobalt-300 font-mono">CURRENCY</code>
              </p>

              <label className="mt-4 px-4 py-2 rounded-xl bg-cobalt-500/15 hover:bg-cobalt-500/25 border border-cobalt-500/40 text-cobalt-200 text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                <span>{bankFile ? bankFile.name : 'Choose Bank CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBankChange}
                  className="hidden"
                />
              </label>

              {bankFile && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-[11px] text-tealmatch-light mt-2.5 font-mono bg-tealmatch-bg px-2.5 py-1 rounded-md border border-tealmatch-border/40"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ready ({(bankFile.size / 1024).toFixed(1)} KB)</span>
                </motion.div>
              )}
            </motion.div>

            {/* Ledger Transactions Dropzone */}
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setIsLedgerDragging(true); }}
              onDragLeave={() => setIsLedgerDragging(false)}
              onDrop={handleLedgerDrop}
              animate={{
                scale: isLedgerDragging ? 1.02 : 1,
                borderColor: isLedgerDragging ? '#14B8A6' : 'rgba(20,184,166,0.35)'
              }}
              className={`p-6 rounded-xl bg-ink-850/80 border border-dashed flex flex-col items-center justify-center text-center relative transition-all ${
                isLedgerDragging ? 'bg-tealmatch-bg shadow-glow' : 'hover:border-tealmatch-light'
              }`}
            >
              <UploadCloud className={`w-8 h-8 mb-2 transition-transform ${isLedgerDragging ? 'scale-110 text-tealmatch-light' : 'text-tealmatch-light'}`} />
              <span className="text-xs font-mono font-semibold text-ink-100 uppercase tracking-wider">
                2. Internal Ledger File
              </span>
              <p className="text-[11px] text-ink-400 mt-1 max-w-xs">
                Expected columns: <code className="text-tealmatch-light font-mono">REFERENCE</code>, <code className="text-tealmatch-light font-mono">TXN_DATE</code>, <code className="text-tealmatch-light font-mono">AMOUNT</code>, <code className="text-tealmatch-light font-mono">DESCRIPTION</code>
              </p>

              <label className="mt-4 px-4 py-2 rounded-xl bg-tealmatch-bg hover:bg-tealmatch-bg/80 border border-tealmatch-border text-tealmatch-light text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                <span>{ledgerFile ? ledgerFile.name : 'Choose Ledger CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleLedgerChange}
                  className="hidden"
                />
              </label>

              {ledgerFile && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-[11px] text-tealmatch-light mt-2.5 font-mono bg-tealmatch-bg px-2.5 py-1 rounded-md border border-tealmatch-border/40"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ready ({(ledgerFile.size / 1024).toFixed(1)} KB)</span>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Upload Progress Bar if processing */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full bg-ink-950 rounded-full h-1.5 overflow-hidden border border-ink-800"
            >
              <motion.div
                className="bg-cobalt-500 h-full rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                style={{ width: '50%' }}
              />
            </motion.div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-ink-500 font-mono">
              Protected against SQL injection and binary floating point inaccuracies.
            </span>

            <motion.button
              type="submit"
              whileHover={prefersReduced ? undefined : { scale: uploading || !bankFile || !ledgerFile ? 1 : 1.02 }}
              whileTap={prefersReduced ? undefined : { scale: uploading || !bankFile || !ledgerFile ? 1 : 0.98 }}
              disabled={uploading || !bankFile || !ledgerFile}
              className="px-6 py-2.5 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 disabled:opacity-40 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
              <span>{uploading ? 'Reconciling in Exasol...' : 'Execute Exasol Reconciliation'}</span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};
