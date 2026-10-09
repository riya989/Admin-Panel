import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Clock,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Store,
  Layers,
  Sliders,
  MessageSquare,
  User,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Info,
  Wrench,
  FileCheck,
  Send,
  AlertCircle,
} from 'lucide-react';
import type { Shop, AdminAuditLog } from '../../types/admin';
import { fetchShopAuditLogs, createShopAuditNote } from '../../lib/api';

interface ShopActivityTimelineProps {
  shop: Shop;
  initialLogs?: AdminAuditLog[];
  onRefreshParent?: () => Promise<void> | void;
}

type TimelineFilter = 'all' | 'status' | 'verification' | 'admin' | 'batch';

export const ShopActivityTimeline: React.FC<ShopActivityTimelineProps> = ({
  shop,
  initialLogs = [],
  onRefreshParent,
}) => {
  const [logs, setLogs] = useState<AdminAuditLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<TimelineFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note Form State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<string>('ADMIN_NOTE_ADDED');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccessMessage, setNoteSuccessMessage] = useState<string | null>(null);

  // Sync when initialLogs changes from parent
  useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
    }
  }, [initialLogs]);

  // Load audit logs for this specific shop
  const loadTimelineLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchShopAuditLogs(shop.id);
      if (Array.isArray(data)) {
        setLogs(data);
      }
      if (onRefreshParent) {
        await onRefreshParent();
      }
    } catch (err) {
      console.warn('Could not fetch shop audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit a new admin audit note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    setNoteSuccessMessage(null);
    try {
      const res = await createShopAuditNote(shop.id, noteContent.trim(), noteCategory);
      if (res?.log) {
        setLogs((prev) => [res.log, ...prev]);
      } else {
        await loadTimelineLogs();
      }
      setNoteContent('');
      setIsAddingNote(false);
      setNoteSuccessMessage('Administrative audit entry recorded.');
      setTimeout(() => setNoteSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to create audit note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCopyEvent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to categorize log action
  const getActionCategory = (action: string): 'status' | 'verification' | 'admin' | 'batch' | 'lifecycle' => {
    const act = action.toUpperCase();
    if (act.includes('BATCH')) return 'batch';
    if (act.includes('KYC') || act.includes('DOCUMENT') || act.includes('VERIF')) return 'verification';
    if (act.includes('STATUS') || act.includes('SUSPEND') || act.includes('ACTIVATE') || act.includes('DEACTIVATE')) {
      return 'status';
    }
    if (act.includes('REGISTERED') || act.includes('INIT')) return 'lifecycle';
    return 'admin';
  };

  // Human-readable titles & badge styles
  const getEventVisuals = (log: AdminAuditLog) => {
    const act = log.action.toUpperCase();

    if (act.includes('KYC_APPROVED') || act.includes('DOCUMENT_VERIFIED')) {
      return {
        title: 'KYC Verification Approved',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        dotBorder: 'border-emerald-500 bg-emerald-950 text-emerald-400',
        categoryTag: 'Compliance Verified',
      };
    }
    if (act.includes('KYC_REJECTED') || act.includes('DOCUMENT_REJECTED')) {
      return {
        title: 'KYC Verification Rejected',
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        dotBorder: 'border-rose-500 bg-rose-950 text-rose-400',
        categoryTag: 'KYC Flagged',
      };
    }
    if (act.includes('KYC_SUBMITTED')) {
      return {
        title: 'KYC Dossier Submitted',
        icon: <FileText className="w-4 h-4 text-sky-400" />,
        badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
        dotBorder: 'border-sky-500 bg-sky-950 text-sky-400',
        categoryTag: 'Dossier Submission',
      };
    }
    if (act.includes('SHOP_SUSPEND')) {
      return {
        title: 'Shop Suspended by Admin',
        icon: <Ban className="w-4 h-4 text-rose-400" />,
        badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        dotBorder: 'border-rose-500 bg-rose-950 text-rose-400',
        categoryTag: 'Administrative Suspension',
      };
    }
    if (act.includes('SHOP_UNSUSPEND') || act.includes('SHOP_ACTIVATE')) {
      return {
        title: 'Shop Reactivated / Unlocked',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        dotBorder: 'border-emerald-500 bg-emerald-950 text-emerald-400',
        categoryTag: 'Operational Activation',
      };
    }
    if (act.includes('MAINTENANCE')) {
      return {
        title: 'Set to Maintenance Mode',
        icon: <Wrench className="w-4 h-4 text-amber-400" />,
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        dotBorder: 'border-amber-500 bg-amber-950 text-amber-400',
        categoryTag: 'Maintenance State',
      };
    }
    if (act.includes('ARCHIVED')) {
      return {
        title: 'Shop Archived',
        icon: <Ban className="w-4 h-4 text-slate-400" />,
        badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
        dotBorder: 'border-slate-600 bg-slate-900 text-slate-400',
        categoryTag: 'Shop Archived',
      };
    }
    if (act.includes('BATCH')) {
      return {
        title: `Batch Action: ${log.action.replace('SHOPS_BATCH_', '').replace(/_/g, ' ')}`,
        icon: <Sliders className="w-4 h-4 text-purple-400" />,
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
        dotBorder: 'border-purple-500 bg-purple-950 text-purple-400',
        categoryTag: 'Batch Operation',
      };
    }
    if (act.includes('REGISTERED')) {
      return {
        title: 'Shop Profile Registered',
        icon: <Store className="w-4 h-4 text-cyan-400" />,
        badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
        dotBorder: 'border-cyan-500 bg-cyan-950 text-cyan-400',
        categoryTag: 'Merchant Onboarding',
      };
    }
    if (act.includes('DOCUMENT_ATTACHED')) {
      return {
        title: 'Compliance Document Uploaded',
        icon: <FileCheck className="w-4 h-4 text-indigo-400" />,
        badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
        dotBorder: 'border-indigo-500 bg-indigo-950 text-indigo-400',
        categoryTag: 'Document Attached',
      };
    }

    // Default Admin Note or Action
    return {
      title: log.action.replace(/_/g, ' '),
      icon: <MessageSquare className="w-4 h-4 text-violet-400" />,
      badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
      dotBorder: 'border-violet-500 bg-violet-950 text-violet-400',
      categoryTag: 'Admin Action',
    };
  };

  // Format relative time helper
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Summary counts
  const summaryCounts = useMemo(() => {
    const total = logs.length;
    const statusCount = logs.filter((l) => getActionCategory(l.action) === 'status').length;
    const kycCount = logs.filter((l) => getActionCategory(l.action) === 'verification').length;
    const adminCount = logs.filter((l) => getActionCategory(l.action) === 'admin').length;
    const batchCount = logs.filter((l) => getActionCategory(l.action) === 'batch').length;

    return { total, statusCount, kycCount, adminCount, batchCount };
  }, [logs]);

  // Filter & Sort logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by category
    if (filterType !== 'all') {
      result = result.filter((l) => {
        const cat = getActionCategory(l.action);
        if (filterType === 'status') return cat === 'status';
        if (filterType === 'verification') return cat === 'verification';
        if (filterType === 'admin') return cat === 'admin';
        if (filterType === 'batch') return cat === 'batch';
        return true;
      });
    }

    // Filter by search keyword
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q)) ||
          (l.admin_email && l.admin_email.toLowerCase().includes(q)) ||
          (l.admin_id && l.admin_id.toLowerCase().includes(q)) ||
          (l.target_type && l.target_type.toLowerCase().includes(q))
      );
    }

    // Sort order
    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [logs, filterType, searchTerm, sortOrder]);

  return (
    <div className="space-y-5">
      {/* Top Overview & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Events</div>
            <div className="text-lg font-bold font-mono text-slate-100">{summaryCounts.total}</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Status Transitions</div>
            <div className="text-lg font-bold font-mono text-amber-400">{summaryCounts.statusCount}</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">KYC / Compliance</div>
            <div className="text-lg font-bold font-mono text-sky-400">{summaryCounts.kycCount}</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Admin Actions</div>
            <div className="text-lg font-bold font-mono text-purple-400">{summaryCounts.adminCount + summaryCounts.batchCount}</div>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {noteSuccessMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{noteSuccessMessage}</span>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search history by action, admin, keyword or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              title={sortOrder === 'desc' ? 'Switch to Oldest First' : 'Switch to Newest First'}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadTimelineLogs}
              disabled={loading}
              title="Refresh timeline from audit vault"
              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            </button>

            {/* Add Admin Note Button */}
            <button
              type="button"
              onClick={() => setIsAddingNote((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                isAddingNote
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? 'Cancel Note' : 'Add Admin Note'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-900 text-xs scrollbar-none">
          <span className="text-[11px] text-slate-500 font-medium mr-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Activity', count: summaryCounts.total },
            { id: 'status', label: 'Status & Ops', count: summaryCounts.statusCount },
            { id: 'verification', label: 'KYC & Compliance', count: summaryCounts.kycCount },
            { id: 'admin', label: 'Admin Actions', count: summaryCounts.adminCount },
            { id: 'batch', label: 'Batch Updates', count: summaryCounts.batchCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as TimelineFilter)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${filterType === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Inline Form: Add Admin Note */}
      {isAddingNote && (
        <form
          onSubmit={handleAddNote}
          className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-3 animate-fadeIn shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Record Administrative Audit Note</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Permanent Audit Trail</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] text-slate-400 mb-1">Action Category</label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ADMIN_NOTE_ADDED">General Audit Note</option>
                <option value="HYGIENE_INSPECTION_NOTE">Hygiene & Safety Review</option>
                <option value="COMPLIANCE_REVIEW_NOTE">Compliance & KYC Note</option>
                <option value="MERCHANT_COMMUNICATION_RECORD">Merchant Call / Communication</option>
                <option value="OPERATIONAL_DECISION_RECORD">Operational Decision</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Administrative Note / Findings</label>
              <input
                type="text"
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="e.g. Conducted phone verification with owner; clarified stall hours and address proof..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingNote || !noteContent.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{submittingNote ? 'Saving Entry...' : 'Save to Timeline'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Chronological Timeline Stream */}
      {filteredLogs.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-10 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-300">No activity events found</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search terms or clearing the category filter.'
                : 'No historical actions recorded yet for this merchant shop.'}
            </p>
          </div>
          {(searchTerm || filterType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Reset Search & Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/40 before:via-slate-800 before:to-slate-800/20">
          {filteredLogs.map((log) => {
            const visuals = getEventVisuals(log);
            const timeAgo = formatTimeAgo(log.created_at);
            const formattedDate = new Date(log.created_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <div key={log.id} className="relative group">
                {/* Timeline Node Dot */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${visuals.dotBorder}`}
                >
                  {visuals.icon}
                </div>

                {/* Event Card */}
                <div className="bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 transition-all hover:shadow-lg space-y-2.5">
                  {/* Event Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-xs text-slate-100">{visuals.title}</span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${visuals.badgeBg}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                        {visuals.categoryTag}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[11px] text-emerald-400 font-semibold" title={formattedDate}>
                        {timeAgo}
                      </span>
                      <span className="text-slate-600 hidden sm:inline">·</span>
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Performed By & Target Info */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">
                        By: <span className="font-mono text-slate-300">{log.admin_email || log.admin_id || 'System Automation'}</span>
                      </span>
                    </div>
                    <span className="text-slate-700">·</span>
                    <div className="text-[11px] text-slate-400">
                      Target: <span className="font-mono text-slate-300 capitalize">{log.target_type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Justification / Reason Callout */}
                  {log.reason && (
                    <div className="p-3 bg-slate-900/80 border-l-2 border-emerald-500/50 rounded-r-lg text-xs text-slate-300 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Justification / Details:</div>
                      <p className="text-slate-200 leading-relaxed italic">"{log.reason}"</p>
                    </div>
                  )}

                  {/* Metadata Chips (if present) */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 text-[10px] font-medium mr-1">Metadata:</span>
                      {Object.entries(log.metadata)
                        .filter(([k]) => k !== 'shop_id')
                        .map(([key, val]) => (
                          <span
                            key={key}
                            className="bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded"
                          >
                            <span className="text-slate-500">{key}:</span> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Footer & Copy Event Info */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                    <span>ID: {log.id}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyEvent(
                          log.id,
                          `[Audit Event ${log.id}] Action: ${log.action} | Time: ${log.created_at} | Admin: ${log.admin_email} | Reason: ${log.reason || 'N/A'}`
                        )
                      }
                      className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === log.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy log snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
