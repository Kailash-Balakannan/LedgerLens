import React, { useState } from 'react';
import type { DbHealth } from '../../types';
import { Database, AlertCircle, RefreshCw } from 'lucide-react';

interface ConnectionPillProps {
  health: DbHealth | null;
  loading: boolean;
  onRefresh: () => void;
}

export const ConnectionPill: React.FC<ConnectionPillProps> = ({ health, loading, onRefresh }) => {
  const [showDetail, setShowDetail] = useState(false);

  const isConnected = health?.database?.connected ?? false;

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-900 border border-ink-700/80 hover:border-ink-600 text-xs text-ink-300 transition-all cursor-pointer"
        onClick={() => setShowDetail(!showDetail)}
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tealmatch-light animate-pulse' : 'bg-redcrit-light'}`} />
          <Database className="w-3.5 h-3.5 text-ink-400" />
          <span className="font-mono text-[11px] text-ink-200">
            {isConnected ? 'Exasol DB' : 'Exasol Offline'}
          </span>
        </div>

        {isConnected && health && (
          <span className="num-tabular text-[10px] text-ink-500 font-mono pl-1 border-l border-ink-800">
            {health.latency_ms}ms
          </span>
        )}

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          title="Refresh database connection"
          className="text-ink-500 hover:text-ink-200 p-0.5"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cobalt-400' : ''}`} />
        </button>
      </div>

      {showDetail && health && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 p-4 bg-ink-900 border border-ink-600 rounded-xl shadow-card text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink-800">
            <span className="font-semibold text-ink-100">Exasol Database Status</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isConnected ? 'bg-tealmatch-bg text-tealmatch-light' : 'bg-redcrit-bg text-redcrit-light'}`}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="space-y-2 text-ink-300">
            <div className="flex justify-between">
              <span className="text-ink-500">Instance Host:</span>
              <span className="font-mono text-ink-200">{health.database.dsn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Target Schema:</span>
              <span className="font-mono text-ink-200">{health.database.schema}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Version:</span>
              <span className="font-mono text-ink-200">{health.database.version || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Engine Latency:</span>
              <span className="font-mono text-tealmatch-light">{health.latency_ms} ms</span>
            </div>

            {!isConnected && health.database.error && (
              <div className="mt-2 p-2 rounded bg-redcrit-bg border border-redcrit-border text-[11px] text-redcrit-light">
                <div className="flex items-center gap-1 font-semibold mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Connection Issue</span>
                </div>
                {health.database.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
