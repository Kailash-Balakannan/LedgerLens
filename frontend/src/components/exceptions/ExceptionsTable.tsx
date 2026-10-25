import React, { useState, useMemo } from 'react';
import type { ReconciliationItem, ExceptionCategory, ReviewStatus } from '../../types';
import { CategoryBadge, ReviewStatusBadge } from '../common/Badge';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { Search, ArrowUpDown, Eye } from 'lucide-react';

interface ExceptionsTableProps {
  items: ReconciliationItem[];
  selectedReference: string | null;
  onSelectReference: (reference: string) => void;
  activeCategoryFilter?: ExceptionCategory | 'ALL';
  onFilterCategory?: (category: ExceptionCategory | 'ALL') => void;
}

export const ExceptionsTable: React.FC<ExceptionsTableProps> = ({
  items,
  selectedReference,
  onSelectReference,
  activeCategoryFilter = 'ALL',
  onFilterCategory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'reference' | 'variance' | 'priority' | 'bank_amount'>('priority');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (activeCategoryFilter !== 'ALL' && item.exception_category !== activeCategoryFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && item.review_status !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const refMatch = item.reference.toLowerCase().includes(query);
        const reasonMatch = item.exception_reason.toLowerCase().includes(query);
        const descMatch = (item.bank_records.some((b) => b.DESCRIPTION.toLowerCase().includes(query)) ||
          item.ledger_records.some((l) => l.DESCRIPTION.toLowerCase().includes(query)));
        if (!refMatch && !reasonMatch && !descMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'reference') {
        comparison = a.reference.localeCompare(b.reference);
      } else if (sortField === 'variance') {
        comparison = Math.abs(a.variance) - Math.abs(b.variance);
      } else if (sortField === 'priority') {
        comparison = a.intelligence.priority_score - b.intelligence.priority_score;
      } else if (sortField === 'bank_amount') {
        comparison = a.bank_amount - b.bank_amount;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [items, activeCategoryFilter, statusFilter, searchTerm, sortField, sortAsc]);

  const handleSort = (field: 'reference' | 'variance' | 'priority' | 'bank_amount') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-2xl bg-ink-900 border border-ink-700/80 shadow-card overflow-hidden">
      {/* Table Action Bar */}
      <div className="p-4 border-b border-ink-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-ink-850/60">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reference, description, reason..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ink-900 border border-ink-700/80 focus:border-cobalt-400 focus:outline-none text-xs text-ink-100 placeholder-ink-500 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Category Filter */}
          <select
            value={activeCategoryFilter}
            onChange={(e) => onFilterCategory && onFilterCategory(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-ink-900 border border-ink-700/80 text-xs text-ink-300 focus:border-cobalt-400 focus:outline-none font-sans cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="MATCHED">Matched</option>
            <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
            <option value="DUPLICATE_REFERENCE">Duplicate Reference</option>
            <option value="MISSING_FROM_LEDGER">Missing in Ledger</option>
            <option value="MISSING_FROM_BANK">Missing in Bank</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-ink-900 border border-ink-700/80 text-xs text-ink-300 focus:border-cobalt-400 focus:outline-none font-sans cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNREVIEWED">Unreviewed</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-ink-800 bg-ink-950/60 text-[11px] font-mono text-ink-400 uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">
                <button 
                  onClick={() => handleSort('reference')}
                  className="flex items-center gap-1 hover:text-ink-200"
                >
                  <span>Reference</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-medium text-right">Records (B / L)</th>
              <th className="py-3 px-4 font-medium text-right">
                <button 
                  onClick={() => handleSort('bank_amount')}
                  className="flex items-center gap-1 justify-end hover:text-ink-200 ml-auto"
                >
                  <span>Bank Amt</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-medium text-right">Ledger Amt</th>
              <th className="py-3 px-4 font-medium text-right">
                <button 
                  onClick={() => handleSort('variance')}
                  className="flex items-center gap-1 justify-end hover:text-ink-200 ml-auto"
                >
                  <span>Variance</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-medium">Classification</th>
              <th className="py-3 px-4 font-medium">
                <button 
                  onClick={() => handleSort('priority')}
                  className="flex items-center gap-1 hover:text-ink-200"
                >
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-medium">Review Status</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/60 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-ink-500">
                  No reconciliation records match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedReference === item.reference;

                return (
                  <tr
                    key={`row-${item.reference}`}
                    onClick={() => onSelectReference(item.reference)}
                    className={`hover:bg-ink-800/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cobalt-500/10' : ''
                    }`}
                  >
                    {/* Reference */}
                    <td className="py-3.5 px-4 font-mono font-bold text-ink-100 whitespace-nowrap">
                      {item.reference}
                    </td>

                    {/* Records Count */}
                    <td className="py-3.5 px-4 font-mono text-ink-400 text-right whitespace-nowrap">
                      <span className="text-cobalt-400 font-semibold">{item.bank_count}</span>
                      <span className="mx-1 text-ink-600">/</span>
                      <span className="text-tealmatch-light font-semibold">{item.ledger_count}</span>
                    </td>

                    {/* Bank Amount */}
                    <td className="py-3.5 px-4 num-tabular text-right text-ink-200 whitespace-nowrap">
                      {item.bank_count > 0 ? `₹ ${item.bank_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>

                    {/* Ledger Amount */}
                    <td className="py-3.5 px-4 num-tabular text-right text-ink-200 whitespace-nowrap">
                      {item.ledger_count > 0 ? `₹ ${item.ledger_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>

                    {/* Variance */}
                    <td className="py-3.5 px-4 num-tabular text-right whitespace-nowrap font-medium">
                      {item.variance === 0 ? (
                        <span className="text-tealmatch-light">₹ 0.00</span>
                      ) : (
                        <span className="text-amberalert-light">
                          {item.variance > 0 ? `+ ₹ ${item.variance.toFixed(2)}` : `- ₹ ${Math.abs(item.variance).toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CategoryBadge category={item.exception_category} size="sm" />
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityIndicator
                        score={item.intelligence.priority_score}
                        label={item.intelligence.priority_label}
                        breakdown={item.intelligence.priority_breakdown}
                      />
                    </td>

                    {/* Review Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ReviewStatusBadge status={item.review_status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReference(item.reference);
                        }}
                        className="p-1.5 rounded-lg bg-ink-800 hover:bg-cobalt-500 hover:text-white text-ink-300 border border-ink-700 transition-all inline-flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-ink-800 bg-ink-950/40 flex items-center justify-between text-xs text-ink-500 font-mono">
        <span>Showing {filteredItems.length} of {items.length} references</span>
        <span>Click any row to open evidence investigation</span>
      </div>
    </div>
  );
};
