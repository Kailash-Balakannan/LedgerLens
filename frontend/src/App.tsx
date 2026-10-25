import React, { useState, useEffect } from 'react';
import { 
  fetchHealth, 
  fetchReconciliation, 
  fetchRuns, 
  submitReview,
  fetchExceptionDetail
} from './api';
import type { 
  ReconciliationResponse, 
  DbHealth, 
  RunInfo, 
  ReconciliationItem, 
  ExceptionCategory, 
  ReviewStatus 
} from './types';
import { Logo } from './components/common/Logo';
import { ConnectionPill } from './components/common/ConnectionPill';
import { WelcomeReveal } from './components/welcome/WelcomeReveal';
import { KPIBoard } from './components/dashboard/KPIBoard';
import { SignatureReconciliationGraph } from './components/dashboard/SignatureReconciliationGraph';
import { CategoryBreakdown } from './components/dashboard/CategoryBreakdown';
import { PriorityReviewQueue } from './components/dashboard/PriorityReviewQueue';
import { ExceptionsTable } from './components/exceptions/ExceptionsTable';
import { ExceptionInvestigationDrawer } from './components/investigation/ExceptionInvestigationDrawer';
import { ReconciliationWorkspace } from './components/workspace/ReconciliationWorkspace';
import { AuditLogModal } from './components/audit/AuditLogModal';
import { 
  LayoutDashboard, 
  TableProperties, 
  UploadCloud, 
  History, 
  Download, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export const App: React.FC = () => {
  const [welcomeDone, setWelcomeDone] = useState<boolean>(() => {
    return localStorage.getItem('ledgerlens_welcomed') === 'true';
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'exceptions' | 'workspace'>('overview');
  const [currentRunId, setCurrentRunId] = useState<string>('DEFAULT');
  const [runs, setRuns] = useState<RunInfo[]>([]);
  const [data, setData] = useState<ReconciliationResponse | null>(null);
  const [health, setHealth] = useState<DbHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ReconciliationItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ExceptionCategory | 'ALL'>('ALL');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [reviewerName] = useState<string>('Finance Ops Reviewer');

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, [currentRunId]);

  // Fetch full exception detail including audit history when a reference is selected
  useEffect(() => {
    if (selectedReference) {
      fetchExceptionDetail(currentRunId, selectedReference)
        .then((detail) => setSelectedDetail(detail))
        .catch((err) => {
          console.error('Failed to fetch exception detail:', err);
        });
    } else {
      setSelectedDetail(null);
    }
  }, [selectedReference, currentRunId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [healthRes, reconRes, runsRes] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchReconciliation(currentRunId),
        fetchRuns().catch(() => [])
      ]);
      setHealth(healthRes);
      setData(reconRes);
      setRuns(runsRes.length > 0 ? runsRes : [{
        RUN_ID: 'DEFAULT',
        RUN_TYPE: 'SYNTHETIC_DEFAULT',
        SOURCE_NAME: 'Exasol Standard CloseWise Source',
        BANK_RECORD_COUNT: 6,
        LEDGER_RECORD_COUNT: 6,
        CREATED_AT: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async (reference: string, newStatus: ReviewStatus, note: string) => {
    await submitReview(currentRunId, reference, newStatus, note, reviewerName);
    // Refresh dataset and exception detail in parallel
    const [refreshed, refreshedDetail] = await Promise.all([
      fetchReconciliation(currentRunId),
      fetchExceptionDetail(currentRunId, reference).catch(() => null)
    ]);
    setData(refreshed);
    if (refreshedDetail) {
      setSelectedDetail(refreshedDetail);
    }
  };

  const handleUploadSuccess = (newRunResult: ReconciliationResponse) => {
    setCurrentRunId(newRunResult.run_id);
    setData(newRunResult);
    setActiveTab('overview');
    fetchRuns().then(setRuns).catch(() => {});
  };

  const handleWelcomeComplete = () => {
    setWelcomeDone(true);
    localStorage.setItem('ledgerlens_welcomed', 'true');
  };

  const fallbackItem: ReconciliationItem | null = data?.items.find((i) => i.reference === selectedReference) || null;
  const activeItem: ReconciliationItem | null = selectedDetail || fallbackItem;

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex flex-col font-sans selection:bg-cobalt-500 selection:text-white">
      {/* Welcome Entrance Sequence on first visit */}
      {!welcomeDone && <WelcomeReveal onComplete={handleWelcomeComplete} />}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-ink-950/80 backdrop-blur-md border-b border-ink-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Product Identity */}
          <div className="flex items-center gap-6">
            <Logo size="md" />

            {/* Run context indicator */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-ink-800 font-mono text-xs text-ink-400">
              <span>Run:</span>
              <span className="font-bold text-cobalt-300 bg-cobalt-500/10 px-2.5 py-0.5 rounded-full border border-cobalt-500/20">
                {currentRunId}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 rounded-xl bg-ink-900 border border-ink-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-ink-800 text-ink-100 shadow-sm border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cobalt-400" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('exceptions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'exceptions'
                  ? 'bg-ink-800 text-ink-100 shadow-sm border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5 text-amberalert-light" />
              <span>Exceptions Queue</span>
              {data && data.kpis.unresolved_exceptions > 0 && (
                <span className="num-tabular text-[10px] px-1.5 py-0.2 rounded-full bg-amberalert-bg text-amberalert-light font-bold">
                  {data.kpis.unresolved_exceptions}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-ink-800 text-ink-100 shadow-sm border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-tealmatch-light" />
              <span>Ingestion Studio</span>
            </button>
          </nav>

          {/* Utilities: Audit Trail, Export & DB Health */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="p-2 rounded-xl bg-ink-900 hover:bg-ink-850 border border-ink-800 text-ink-300 hover:text-ink-100 transition-colors cursor-pointer"
              title="View full audit log"
            >
              <History className="w-4 h-4 text-cobalt-400" />
            </button>

            <a
              href={`/api/export/csv?run_id=${encodeURIComponent(currentRunId)}`}
              download={`reconciliation_${currentRunId}.csv`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-900 hover:bg-ink-850 border border-ink-800 text-xs text-ink-300 hover:text-ink-100 transition-colors font-mono cursor-pointer"
              title="Download reconciliation results as CSV"
            >
              <Download className="w-3.5 h-3.5 text-ink-400" />
              <span>Export CSV</span>
            </a>

            <ConnectionPill
              health={health}
              loading={loading}
              onRefresh={loadInitialData}
            />
          </div>
        </div>
      </header>

      {/* Main Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading && !data ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-cobalt-500 animate-spin mb-3" />
            <h3 className="font-display font-semibold text-sm text-ink-200">
              Querying Exasol Reconciliation Engine...
            </h3>
            <p className="text-xs text-ink-500 mt-1 font-mono">
              Aggregating source records, computing decimal-safe variances & checking duplicate keys
            </p>
          </div>
        ) : !data ? (
          <div className="p-8 rounded-2xl bg-ink-900 border border-redcrit-border text-center space-y-3">
            <h3 className="text-sm font-semibold text-redcrit-light">
              Database Connection Failed
            </h3>
            <p className="text-xs text-ink-400 max-w-md mx-auto">
              Could not communicate with the local Exasol Personal instance on port 8563. Check that the container is active.
            </p>
            <button
              onClick={loadInitialData}
              className="px-4 py-2 rounded-xl bg-cobalt-500 text-white text-xs font-semibold cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* View Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Executive KPIs */}
                <KPIBoard kpis={data.kpis} />

                {/* Signature Reconciliation Graph (Visual Signature of LedgerLens) */}
                <SignatureReconciliationGraph
                  items={data.items}
                  selectedReference={selectedReference}
                  onSelectReference={(ref) => {
                    setSelectedReference(ref);
                  }}
                />

                {/* Two Column Grid: Category Distribution & Priority Queue */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdown
                    counts={data.category_counts}
                    totalReferences={data.kpis.total_references}
                    activeFilter={categoryFilter}
                    onFilterCategory={(cat) => {
                      setCategoryFilter(cat);
                      setActiveTab('exceptions');
                    }}
                  />

                  <PriorityReviewQueue
                    items={data.items}
                    onSelectReference={(ref) => setSelectedReference(ref)}
                  />
                </div>
              </div>
            )}

            {/* View Tab 2: Exceptions Table */}
            {activeTab === 'exceptions' && (
              <div className="animate-fadeIn">
                <ExceptionsTable
                  items={data.items}
                  selectedReference={selectedReference}
                  onSelectReference={(ref) => setSelectedReference(ref)}
                  activeCategoryFilter={categoryFilter}
                  onFilterCategory={setCategoryFilter}
                />
              </div>
            )}

            {/* View Tab 3: Ingestion Studio */}
            {activeTab === 'workspace' && (
              <div className="animate-fadeIn">
                <ReconciliationWorkspace
                  currentRunId={currentRunId}
                  runs={runs}
                  onSelectRun={(runId) => setCurrentRunId(runId)}
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Slide-out Exception Investigation Drawer */}
      <ExceptionInvestigationDrawer
        item={activeItem}
        onClose={() => setSelectedReference(null)}
        onUpdateStatus={handleUpdateReview}
        reviewerId={reviewerName}
      />

      {/* Audit History Log Modal */}
      <AuditLogModal
        runId={currentRunId}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Subdued Editorial Footer */}
      <footer className="mt-auto border-t border-ink-800/80 bg-ink-950 py-4 px-6 text-xs text-ink-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-tealmatch-light" />
          <span>LedgerLens · ExaThon India 2026 Submission · Track 01: Money, Risk & Regulation</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <button
            onClick={() => setWelcomeDone(false)}
            className="hover:text-ink-300 transition-colors cursor-pointer"
          >
            Replay Welcome Motion
          </button>
          <span>•</span>
          <span>Engine: PyExasol & Exasol SQL</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
