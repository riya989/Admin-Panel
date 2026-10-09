import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Truck,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  MapPin,
  RefreshCw,
  Download,
  FileDown,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
  Send,
} from 'lucide-react';
import type { ShopVerificationRequest, VerificationStatus } from '../../types/admin';
import { exportVerificationsToCSV } from '../../lib/csvExport';
import { exportVerificationsToPDF } from '../../lib/pdfExport';
import { toast } from '../common/Toast';

interface VerificationListViewProps {
  requests: ShopVerificationRequest[];
  loading: boolean;
  onRefresh: () => void;
  onSelectRequest: (request: ShopVerificationRequest) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchTerm: string;
  onSearchTermChange: (search: string) => void;
  onBatchAction?: (
    ids: string[],
    action: 'approve' | 'reject',
    data?: { notes?: string; rejectionReason?: string }
  ) => Promise<void>;
}

export const VerificationListView: React.FC<VerificationListViewProps> = ({
  requests,
  loading,
  onRefresh,
  onSelectRequest,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  onBatchAction,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchModal, setBatchModal] = useState<'approve' | 'reject' | null>(null);
  const [batchNotes, setBatchNotes] = useState('');
  const [batchRejectionReason, setBatchRejectionReason] = useState('Invalid documents');
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Clear selections when filter or requests change
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => requests.some((r) => r.id === id)));
  }, [requests]);

  const isAllSelected = requests.length > 0 && selectedIds.length === requests.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < requests.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    if (requests.length === 0) {
      toast.error('No Applications to Export', 'There are no verification requests matching current filters.');
      return;
    }
    const count = exportVerificationsToCSV(requests);
    toast.success('KYC List Exported', `Downloaded CSV containing ${count} verification application(s).`);
  };

  const handleExportSelectedCSV = () => {
    const selectedRequests = requests.filter((r) => selectedIds.includes(r.id));
    if (selectedRequests.length === 0) return;
    const count = exportVerificationsToCSV(selectedRequests);
    toast.success('Selected Applications Exported', `Downloaded CSV containing ${count} selected record(s).`);
  };

  const handleExportPDF = (forceSelectedOnly = false) => {
    const isSelected = forceSelectedOnly || selectedIds.length > 0;
    const targetRequests = isSelected
      ? requests.filter((r) => selectedIds.includes(r.id))
      : requests;

    if (targetRequests.length === 0) {
      toast.error('No Applications to Export', 'There are no verification requests matching current filters or selection.');
      return;
    }

    const count = exportVerificationsToPDF({
      requests: targetRequests,
      totalInView: requests.length,
      isSelectedOnly: isSelected,
      filters: {
        statusFilter,
        searchTerm,
      },
    });

    toast.success(
      'KYC PDF Report Generated',
      `Downloaded official PDF dossier with active filtering state summary (${count} records).`
    );
  };

  const handleExecuteBatchApprove = async () => {
    if (!onBatchAction || selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      await onBatchAction(selectedIds, 'approve', { notes: batchNotes });
      setBatchModal(null);
      setBatchNotes('');
      setSelectedIds([]);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleExecuteBatchReject = async () => {
    if (!onBatchAction || selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      await onBatchAction(selectedIds, 'reject', {
        rejectionReason: batchRejectionReason,
        notes: batchNotes,
      });
      setBatchModal(null);
      setBatchNotes('');
      setSelectedIds([]);
    } finally {
      setBatchProcessing(false);
    }
  };

  // Keyboard shortcuts (E for export, T for toggle view, Esc to clear selection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleExportCSV();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleExportPDF(false);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'table' ? 'cards' : 'table'));
      } else if (e.key === 'Escape' && selectedIds.length > 0 && !batchModal) {
        e.preventDefault();
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requests, selectedIds, batchModal]);

  const filterTabs = [
    { id: 'all', label: 'All Requests' },
    { id: 'Submitted', label: 'Pending Review' },
    { id: 'rekyc', label: 'Re-KYC / Updated' },
    { id: 'Under Review', label: 'Under Review' },
    { id: 'Approved', label: 'Approved' },
    { id: 'Rejected', label: 'Rejected' },
    { id: 'Suspended', label: 'Suspended' },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>KYC & Shop Verification Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review food safety credentials, identity documents, and municipal stall permits with batch moderation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* PDF Report Export Button */}
          <button
            onClick={() => handleExportPDF(false)}
            disabled={requests.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
            title={selectedIds.length > 0 ? `Export ${selectedIds.length} selected items to PDF report` : `Export ${requests.length} filtered applications to PDF report`}
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Export PDF</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 font-mono text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700">
              {selectedIds.length > 0 ? selectedIds.length : requests.length}
            </span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={requests.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
            title={`Export ${requests.length} filtered KYC applications to CSV (Press E)`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 font-mono text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700">
              {requests.length}
            </span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
            title="Refresh queue (Press R)"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table view (Press T)"
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card view (Press T)"
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search shop, owner, city, pincode..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <span>Synchronizing KYC applications with Supabase...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Verification Requests Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'No applications match the selected criteria. Try adjusting your search query or status filter.'
              : 'There are currently no shop verification applications pending review.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* High Density SaaS Data Grid with Checkboxes */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="w-10 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                      title={isAllSelected ? 'Deselect all rows' : 'Select all rows'}
                    />
                  </th>
                  <th className="px-5 py-3.5">Shop & Stall Info</th>
                  <th className="px-4 py-3.5">Owner Details</th>
                  <th className="px-4 py-3.5">Location & Area</th>
                  <th className="px-4 py-3.5">KYC Documents</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {requests.map((req) => {
                  const verifiedDocs = req.documents?.filter((d) => d.status === 'Verified').length || 0;
                  const totalDocs = req.documents?.length || 0;
                  const isSelected = selectedIds.includes(req.id);

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-slate-800/60' : ''
                      }`}
                      onClick={() => onSelectRequest(req)}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectRow(req.id, e)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                        />
                      </td>

                      {/* Shop Name & Type */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                            {req.shop?.is_mobile_stall ? (
                              <Truck className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Building2 className="w-4 h-4 text-sky-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block group-hover:text-emerald-400 transition-colors">
                              {req.shop?.name || 'Unnamed Outlet'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {req.shop?.stall_type || (req.shop?.is_mobile_stall ? 'Mobile Stall' : 'Permanent Stall')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner Info */}
                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-200 block">
                          {req.owner?.full_name || 'Merchant Owner'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {req.owner?.phone || req.shop?.phone || req.shop?.contact_phone || 'No phone'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {req.shop?.city || 'Mumbai'}, {req.shop?.area || 'Naigaon East'}
                          </span>
                        </div>
                      </td>

                      {/* Documents Status */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono tabular-nums text-slate-200">
                              {verifiedDocs}/{totalDocs}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">verified</span>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-400">
                        {new Date(req.submitted_at || req.created_at).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : req.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              : req.status?.toLowerCase() === 'rekyc' || req.resubmission_count > 0 || req.shop?.kyc_status === 'rekyc'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                              : req.status === 'Under Review'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          }`}
                        >
                          {req.status === 'Approved' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : req.status === 'Rejected' ? (
                            <XCircle className="w-3 h-3" />
                          ) : req.status?.toLowerCase() === 'rekyc' || req.resubmission_count > 0 || req.shop?.kyc_status === 'rekyc' ? (
                            <RefreshCw className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{req.status?.toLowerCase() === 'rekyc' || req.resubmission_count > 0 || req.shop?.kyc_status === 'rekyc' ? 'Re-KYC' : req.status}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequest(req);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View with Checkboxes */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => {
            const isSelected = selectedIds.includes(req.id);
            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className={`bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected ? 'border-emerald-500/60 bg-slate-850 ring-1 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelectRow(req.id, e)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                      />
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          req.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : req.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : req.status?.toLowerCase() === 'rekyc' || req.resubmission_count > 0 || req.shop?.kyc_status === 'rekyc'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {req.status?.toLowerCase() === 'rekyc' || req.resubmission_count > 0 || req.shop?.kyc_status === 'rekyc' ? 'Re-KYC' : req.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                      {new Date(req.submitted_at || req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm mb-1">{req.shop?.name || 'Unnamed Shop'}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                    {req.shop?.is_mobile_stall ? <Truck className="w-3.5 h-3.5 text-amber-400" /> : <Building2 className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{req.shop?.is_mobile_stall ? 'Mobile Stall' : 'Permanent Restaurant'}</span>
                    <span>·</span>
                    <span>{req.shop?.city || 'Mumbai'}</span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 mb-4 pt-3 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applicant:</span>
                      <span className="text-slate-200 font-medium">{req.owner?.full_name || 'Merchant'}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Contact:</span>
                      <span className="text-slate-300">{req.owner?.phone || req.shop?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Documents:</span>
                      <span className="text-slate-300">
                        {req.documents?.filter((d) => d.status === 'Verified').length || 0} / {req.documents?.length || 0} verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">ID: {req.id.slice(0, 14)}...</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRequest(req);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-6 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 px-5 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                {selectedIds.length} Application{selectedIds.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[10px] text-slate-400">Perform high-efficiency bulk decisions</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchModal('approve')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Batch Approve ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => setBatchModal('reject')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Batch Reject ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => handleExportPDF(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
              title="Download selected applications as PDF report with filter summary"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Export PDF ({selectedIds.length})</span>
            </button>
            <button
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Download selected rows as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Clear selection (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Batch Approval Confirmation Dialog */}
      {batchModal === 'approve' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setBatchModal(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Batch Approve {selectedIds.length} Applications</h3>
                <p className="text-xs text-slate-400">Merchant shops will be verified and activated.</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
              <p>
                You are about to approve <strong>{selectedIds.length}</strong> shop verification requests at once. All pending documents will be marked as verified and merchant food stalls will become discoverable.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Administrative Notes (Optional)
              </label>
              <input
                type="text"
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="e.g. Batch verified under municipal festival waiver..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchApprove}
                disabled={batchProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Batch Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Rejection Dialog */}
      {batchModal === 'reject' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setBatchModal(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Batch Reject {selectedIds.length} Applications</h3>
                <p className="text-xs text-slate-400">Merchants will receive instructions to resubmit.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rejection Reason (Required)
              </label>
              <select
                value={batchRejectionReason}
                onChange={(e) => setBatchRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Invalid documents">Invalid or incomplete documents</option>
                <option value="Documents unclear or illegible">Documents unclear or illegible</option>
                <option value="FSSAI information missing or invalid">FSSAI license information missing</option>
                <option value="Municipal permit verification failed">Municipal trade permit expired</option>
                <option value="Location verification failed">Stall location verification failed</option>
                <option value="Other compliance issue">General compliance standards not met</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Actionable Feedback / Notes (Optional)
              </label>
              <textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="Provide clear feedback so vendors know what to fix before resubmitting..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchReject}
                disabled={batchProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Reject {selectedIds.length} Applications</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
