import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Eye,
  X,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import type { PlatformReport } from '../../types/admin';

interface ReportsViewProps {
  reports: PlatformReport[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateReport: (id: string, update: { status?: string; adminNotes?: string }) => Promise<void>;
  onCreateReport: (reportData: any) => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  loading,
  onRefresh,
  onUpdateReport,
  onCreateReport,
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<PlatformReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('Resolved');
  const [updating, setUpdating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New report state
  const [createCategory, setCreateCategory] = useState('Shop complaint');
  const [createTargetType, setCreateTargetType] = useState('shop');
  const [createTargetName, setCreateTargetName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPriority, setCreatePriority] = useState('Medium');
  const [createLoading, setCreateLoading] = useState(false);

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status.toLowerCase() !== statusFilter.toLowerCase())
      return false;
    if (categoryFilter !== 'all' && r.category.toLowerCase() !== categoryFilter.toLowerCase())
      return false;
    return true;
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setUpdating(true);
    try {
      await onUpdateReport(selectedReport.id, {
        status: newStatus,
        adminNotes: adminNotes.trim(),
      });
      setSelectedReport(null);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await onCreateReport({
        target_type: createTargetType,
        target_name: createTargetName,
        category: createCategory,
        description: createDescription,
        priority: createPriority,
      });
      setShowCreateModal(false);
      setCreateTargetName('');
      setCreateDescription('');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Platform Reports & Issue Tickets</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Resolve consumer complaints, payment discrepancies, and vendor compliance warnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Platform Issue</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
        >
          <option value="all">All Ticket Statuses</option>
          <option value="Open">Open</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
        >
          <option value="all">All Issue Categories</option>
          <option value="Shop complaint">Shop complaint</option>
          <option value="Customer complaint">Customer complaint</option>
          <option value="Payment issue">Payment issue</option>
          <option value="Order issue">Order issue</option>
          <option value="KYC issue">KYC issue</option>
          <option value="Fraud/suspicious activity">Fraud/suspicious activity</option>
          <option value="Technical issue">Technical issue</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Report Tickets List */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
          <span>Loading issue tickets...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No platform reports found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              onClick={() => {
                setSelectedReport(rep);
                setNewStatus(rep.status);
                setAdminNotes(rep.admin_notes || '');
              }}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 cursor-pointer transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                      rep.status === 'Resolved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : rep.status === 'Open'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    }`}
                  >
                    {rep.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    {rep.priority} Priority
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-semibold text-slate-200">{rep.category}</span>
                </div>

                <p className="text-xs text-slate-300 font-medium line-clamp-2">{rep.description}</p>

                <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1 font-mono">
                  <span>Target: {rep.target_name || rep.target_type}</span>
                  <span>·</span>
                  <span>Reported by: {rep.reporter_name || 'Anonymous'}</span>
                  <span>·</span>
                  <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg shrink-0 self-end sm:self-center"
              >
                Inspect Ticket
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Inspection / Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-slate-100 text-sm">Issue Ticket {selectedReport.id}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-semibold text-slate-200">{selectedReport.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Entity:</span>
                  <span className="text-slate-200">{selectedReport.target_name || selectedReport.target_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reporter:</span>
                  <span className="text-slate-200">{selectedReport.reporter_name} ({selectedReport.reporter_role})</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Issue Description:</span>
                  <p className="text-slate-200 bg-slate-900 p-2 rounded border border-slate-800">{selectedReport.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Update Resolution Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="Open">Open</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Administrator Notes & Findings
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record investigative notes, communications with shop owner or customer..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  disabled={updating}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {updating ? 'Updating...' : 'Save Ticket Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-100 text-sm">Log New Platform Issue</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Issue Category
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="Shop complaint">Shop complaint</option>
                    <option value="Customer complaint">Customer complaint</option>
                    <option value="Payment issue">Payment issue</option>
                    <option value="Order issue">Order issue</option>
                    <option value="KYC issue">KYC issue</option>
                    <option value="Fraud/suspicious activity">Fraud/suspicious activity</option>
                    <option value="Technical issue">Technical issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Severity Priority
                  </label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Entity Name / ID
                </label>
                <input
                  type="text"
                  value={createTargetName}
                  onChange={(e) => setCreateTargetName(e.target.value)}
                  placeholder="e.g. vikrant missal / ord-047332"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description of Issue / Incident
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="State the observed platform problem or complaint details..."
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !createDescription.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {createLoading ? 'Logging...' : 'File Issue Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
