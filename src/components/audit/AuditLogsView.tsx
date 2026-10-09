import React, { useState } from 'react';
import { ScrollText, Search, Filter, ShieldCheck, RefreshCw, Eye } from 'lucide-react';
import type { AdminAuditLog } from '../../types/admin';

interface AuditLogsViewProps {
  logs: AdminAuditLog[];
  loading: boolean;
  onRefresh: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, loading, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== 'all' && !l.action.toLowerCase().includes(actionFilter.toLowerCase()))
      return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.target_id.toLowerCase().includes(q) ||
        l.target_type.toLowerCase().includes(q) ||
        l.admin_email?.toLowerCase().includes(q) ||
        l.reason?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-emerald-400" />
            <span>Admin Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, append-only security ledger recording all moderation and operational decisions.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh audit ledger"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, administrator, target ID, or reason..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Action Types</option>
          <option value="KYC_APPROVED">KYC Approved</option>
          <option value="KYC_REJECTED">KYC Rejected</option>
          <option value="DOCUMENT">Document Verification</option>
          <option value="SHOP_SUSPEND">Shop Suspended</option>
          <option value="SHOP_ACTIVATE">Shop Activated</option>
          <option value="ORDER_STATUS_OVERRIDDEN">Order Override</option>
        </select>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <span>Verifying cryptographic log chain...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No audit entries found matching the filter query.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Action Executed</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5">Administrator</th>
                  <th className="px-4 py-3.5">Justification / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 tabular-nums">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                          log.action.includes('APPROVE') || log.action.includes('ACTIVATE') || log.action.includes('VERIFIED')
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : log.action.includes('REJECT') || log.action.includes('SUSPEND')
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-slate-300 uppercase text-[10px] block">{log.target_type}</span>
                      <span className="text-slate-400 text-[10px] truncate max-w-[140px] block">{log.target_id}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {log.admin_email || log.admin_id}
                    </td>
                    <td className="px-4 py-4 text-slate-300 font-sans text-xs">
                      {log.reason || 'None provided'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-center text-[11px] text-slate-500 font-mono">
        Audit entries are immutable and preserved for compliance review.
      </div>
    </div>
  );
};
