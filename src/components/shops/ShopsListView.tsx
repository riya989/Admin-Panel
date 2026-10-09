import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Store,
  Truck,
  Building2,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  FileDown,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  AlertTriangle,
  Send,
  ShieldCheck,
  Ban,
  Sliders,
  Wrench,
  Archive,
  Trash2,
} from 'lucide-react';
import type { Shop, ShopOperationalStatus } from '../../types/admin';
import { exportShopsToCSV } from '../../lib/csvExport';
import { exportShopsToPDF } from '../../lib/pdfExport';
import { toast } from '../common/Toast';

interface ShopsListViewProps {
  shops: Shop[];
  loading: boolean;
  onRefresh: () => void;
  onSelectShop: (shop: Shop) => void;
  onToggleStatus?: (
    shopId: string,
    action: 'activate' | 'deactivate' | 'suspend' | 'unsuspend',
    reason?: string,
    options?: { suspendOwnerAccount?: boolean; unsuspendOwnerAccount?: boolean }
  ) => Promise<void>;
  onBatchAction?: (
    ids: string[],
    action: 'approve' | 'reject' | 'activate' | 'suspend' | 'unsuspend' | 'edit_status' | 'delete',
    data?: { notes?: string; rejectionReason?: string; status?: string; isOpen?: boolean }
  ) => Promise<void>;
  onDeleteShop?: (shopId: string, reason?: string) => Promise<void>;
}

export const ShopsListView: React.FC<ShopsListViewProps> = ({
  shops,
  loading,
  onRefresh,
  onSelectShop,
  onToggleStatus,
  onBatchAction,
  onDeleteShop,
}) => {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [stallFilter, setStallFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [openFilter, setOpenFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Multi-select & Batch Moderation States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchModal, setBatchModal] = useState<'approve' | 'reject' | 'suspend' | 'unsuspend' | 'edit_status' | 'delete' | null>(null);
  const [batchNotes, setBatchNotes] = useState('');
  const [batchRejectionReason, setBatchRejectionReason] = useState('FSSAI License Expired or Missing');
  const [targetStatus, setTargetStatus] = useState<ShopOperationalStatus>('Maintenance');
  const [targetIsOpen, setTargetIsOpen] = useState<'keep' | 'open' | 'closed'>('keep');
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Single Shop Quick Suspend / Unsuspend State
  const [singleActionShop, setSingleActionShop] = useState<Shop | null>(null);
  const [singleActionType, setSingleActionType] = useState<'suspend' | 'unsuspend' | null>(null);
  const [singleActionReason, setSingleActionReason] = useState('');
  const [singleActionCascadeOwner, setSingleActionCascadeOwner] = useState(false);
  const [singleActionLoading, setSingleActionLoading] = useState(false);

  // Single Shop Delete State
  const [deleteTargetShop, setDeleteTargetShop] = useState<Shop | null>(null);
  const [deletingShop, setDeletingShop] = useState(false);

  const filteredShops = shops.filter((s) => {
    if (cityFilter !== 'all' && s.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (stallFilter === 'mobile' && !s.is_mobile_stall) return false;
    if (stallFilter === 'permanent' && s.is_mobile_stall) return false;
    if (activeFilter === 'active' && !s.is_active) return false;
    if (activeFilter === 'inactive' && s.is_active) return false;
    if (openFilter === 'open' && !s.is_open) return false;
    if (openFilter === 'closed' && s.is_open) return false;

    // Filter by specific operational status
    if (statusFilter !== 'all') {
      const sStatus = (s.operational_status || s.status || (s.is_active ? 'Active' : 'Suspended')).toLowerCase();
      if (statusFilter === 'active' && sStatus !== 'active') return false;
      if (statusFilter === 'maintenance' && sStatus !== 'maintenance') return false;
      if (statusFilter === 'archived' && sStatus !== 'archived') return false;
      if (statusFilter === 'suspended' && sStatus !== 'suspended') return false;
      if (statusFilter === 'under_inspection' && sStatus !== 'under inspection' && sStatus !== 'under_inspection') return false;
      if (statusFilter === 'seasonal' && sStatus !== 'seasonal closure' && sStatus !== 'seasonal') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.area?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.pincode?.includes(q)
      );
    }
    return true;
  });

  // Prune selection if filtered list or shops change
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => shops.some((s) => s.id === id)));
  }, [shops]);

  const isAllSelected = filteredShops.length > 0 && selectedIds.length === filteredShops.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < filteredShops.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShops.map((s) => s.id));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    if (filteredShops.length === 0) {
      toast.error('No Shops to Export', 'There are no shops matching the selected filters.');
      return;
    }
    const count = exportShopsToCSV(filteredShops);
    toast.success('Shops Exported', `Downloaded CSV with ${count} platform shop record(s).`);
  };

  const handleExportSelectedCSV = () => {
    const selectedShops = shops.filter((s) => selectedIds.includes(s.id));
    if (selectedShops.length === 0) return;
    const count = exportShopsToCSV(selectedShops);
    toast.success('Selected Shops Exported', `Downloaded CSV containing ${count} selected shop record(s).`);
  };

  const handleExportPDF = (forceSelectedOnly = false) => {
    const isSelected = forceSelectedOnly || selectedIds.length > 0;
    const targetShops = isSelected
      ? shops.filter((s) => selectedIds.includes(s.id))
      : filteredShops;

    if (targetShops.length === 0) {
      toast.error('No Shops to Export', 'There are no shop outlets matching current filters or selection.');
      return;
    }

    const count = exportShopsToPDF({
      shops: targetShops,
      totalInView: filteredShops.length,
      isSelectedOnly: isSelected,
      filters: {
        search,
        operationalStatus: statusFilter,
        stallType: stallFilter,
        city: cityFilter,
        isOpen: openFilter,
      },
    });

    toast.success(
      'Shops PDF Report Generated',
      `Downloaded official PDF directory report with active filtering state summary (${count} records).`
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

  const handleExecuteBatchEditStatus = async () => {
    if (!onBatchAction || selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      const openOverride = targetIsOpen === 'open' ? true : targetIsOpen === 'closed' ? false : undefined;
      await onBatchAction(selectedIds, 'edit_status', {
        status: targetStatus,
        notes: batchNotes,
        isOpen: openOverride,
      });
      setBatchModal(null);
      setBatchNotes('');
      setSelectedIds([]);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleExecuteBatchSuspend = async () => {
    if (!onBatchAction || selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      await onBatchAction(selectedIds, 'suspend', {
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

  const handleExecuteBatchUnsuspend = async () => {
    if (!onBatchAction || selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      await onBatchAction(selectedIds, 'unsuspend', {
        notes: batchNotes,
      });
      setBatchModal(null);
      setBatchNotes('');
      setSelectedIds([]);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleExecuteSingleAction = async () => {
    if (!onToggleStatus || !singleActionShop || !singleActionType) return;
    setSingleActionLoading(true);
    try {
      await onToggleStatus(singleActionShop.id, singleActionType, singleActionReason, {
        suspendOwnerAccount: singleActionType === 'suspend' && singleActionCascadeOwner,
        unsuspendOwnerAccount: singleActionType === 'unsuspend' && singleActionCascadeOwner,
      });
      setSingleActionShop(null);
      setSingleActionType(null);
      setSingleActionReason('');
      setSingleActionCascadeOwner(false);
    } finally {
      setSingleActionLoading(false);
    }
  };

  // Keyboard shortcut listeners (E for export, Esc to clear selection or close modal)
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
      } else if (e.key === 'Escape') {
        if (batchModal) {
          e.preventDefault();
          setBatchModal(null);
        } else if (selectedIds.length > 0) {
          e.preventDefault();
          setSelectedIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredShops, selectedIds, batchModal]);

  const cities = Array.from(new Set(shops.map((s) => s.city).filter((c): c is string => Boolean(c))));

  const selectedShopsList = shops.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <span>Platform Shops & Food Outlets</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee all registered mobile street vendors, thelas, and permanent restaurants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* PDF Report Export Button */}
          <button
            onClick={() => handleExportPDF(false)}
            disabled={filteredShops.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
            title={selectedIds.length > 0 ? `Export ${selectedIds.length} selected shops to PDF report` : `Export ${filteredShops.length} filtered shops to PDF report`}
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Export PDF</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 font-mono text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700">
              {selectedIds.length > 0 ? selectedIds.length : filteredShops.length}
            </span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredShops.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
            title={`Export ${filteredShops.length} filtered shops to CSV (Press E)`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 font-mono text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700">
              {filteredShops.length}
            </span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
            title="Refresh shops (Press R)"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sticky / Floating Batch Actions Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-950/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>
                <strong className="font-mono text-emerald-200">{selectedIds.length}</strong> shop{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 ml-1 transition-colors"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Batch PDF Export */}
            <button
              onClick={() => handleExportPDF(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
              title="Download selected shops as PDF report with filter summary header"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Export PDF ({selectedIds.length})</span>
            </button>

            {/* Batch Export */}
            <button
              onClick={handleExportSelectedCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
              title="Export selected shops to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Batch Suspend */}
            <button
              onClick={() => {
                setBatchModal('suspend');
                setBatchRejectionReason('Violation of Platform Terms');
                setBatchNotes('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-rose-900/40"
              title="Suspend all selected shops"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Batch Suspend ({selectedIds.length})</span>
            </button>

            {/* Batch Unsuspend / Reactivate */}
            <button
              onClick={() => {
                setBatchModal('unsuspend');
                setBatchNotes('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-emerald-900/40"
              title="Reactivate and unsuspend all selected shops"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Batch Unsuspend ({selectedIds.length})</span>
            </button>

            {/* Batch Edit Status Utility (Maintenance, Archived, etc.) */}
            <button
              onClick={() => {
                setTargetStatus('Maintenance');
                setTargetIsOpen('keep');
                setBatchModal('edit_status');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-amber-900/40"
              title="Apply specific status like Maintenance or Archived to selected shops"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Batch Edit Status</span>
            </button>

            {/* Batch Delete Shops */}
            <button
              onClick={() => {
                setBatchModal('delete');
                setBatchNotes('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-red-950/40"
              title="Permanently delete all selected shops and their KYC records from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Batch Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by shop name, locality, or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Operational Status Filter (Includes Maintenance & Archived) */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Operational Statuses</option>
              <option value="active">Active Outlets</option>
              <option value="maintenance">🛠️ In Maintenance</option>
              <option value="archived">📦 Archived Outlets</option>
              <option value="suspended">🔴 Suspended</option>
              <option value="under_inspection">🔍 Under Inspection</option>
              <option value="seasonal">❄️ Seasonal Closure</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <select
              value={stallFilter}
              onChange={(e) => setStallFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Formats</option>
              <option value="mobile">Mobile Stall / Thela</option>
              <option value="permanent">Permanent Dine-In</option>
            </select>
          </div>

          {/* Operational State */}
          <div>
            <select
              value={openFilter}
              onChange={(e) => setOpenFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Open/Closed</option>
              <option value="open">Currently Open</option>
              <option value="closed">Currently Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <span>Loading shop catalog...</span>
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No shops found matching filter criteria.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  {/* Select All Checkbox Column */}
                  <th className="w-10 px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center justify-center"
                      title={isAllSelected ? 'Deselect all shops' : 'Select all shops in view'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : isPartiallySelected ? (
                        <MinusSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">Shop Name</th>
                  <th className="px-4 py-3.5">Format & Category</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Operational Status</th>
                  <th className="px-4 py-3.5">Operating Hours</th>
                  <th className="px-4 py-3.5">KYC Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredShops.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  const opStatus = s.operational_status || s.status || (s.is_active ? 'Active' : 'Suspended');

                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectShop(s)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td
                        className="w-10 px-4 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectRow(s.id, e)}
                          className="text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center justify-center"
                          title={isSelected ? 'Deselect shop' : 'Select shop'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 shrink-0">
                            {s.is_mobile_stall ? (
                              <Truck className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Building2 className="w-4 h-4 text-sky-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-100 text-xs block group-hover:text-emerald-400 transition-colors">
                              {s.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {s.phone || 'No phone'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-slate-200 font-medium">
                          {s.is_mobile_stall ? 'Mobile Stall / Thela' : 'Permanent Shop'}
                        </div>
                        <div className="text-[11px] text-slate-500">{s.stall_type || 'Fast Food'}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{s.area || s.city}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{s.city}, {s.pincode}</div>
                      </td>

                      {/* Operational Status (Maintenance, Archived, Active, Suspended) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {opStatus === 'Maintenance' ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/25 flex items-center gap-1">
                              <Wrench className="w-2.5 h-2.5" />
                              <span>MAINTENANCE</span>
                            </span>
                          ) : opStatus === 'Archived' ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border bg-slate-800 text-slate-400 border-slate-700 flex items-center gap-1">
                              <Archive className="w-2.5 h-2.5" />
                              <span>ARCHIVED</span>
                            </span>
                          ) : opStatus === 'Under Inspection' ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border bg-indigo-500/10 text-indigo-400 border-indigo-500/25">
                              INSPECTION
                            </span>
                          ) : opStatus === 'Seasonal Closure' ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border bg-sky-500/10 text-sky-400 border-sky-500/25">
                              SEASONAL
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                                s.is_active
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              }`}
                            >
                              {s.is_active ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              s.is_open ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-500 bg-slate-900'
                            }`}
                          >
                            {s.is_open ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono text-[11px] text-slate-400 tabular-nums">
                        {s.opening_time || '10:00 AM'} - {s.closing_time || '11:00 PM'}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            s.verification_status === 'Approved'
                              ? 'text-emerald-400'
                              : s.verification_status === 'Rejected'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {s.verification_status || (s.is_active ? 'Approved' : 'Submitted')}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {onToggleStatus && (
                            s.is_active ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSingleActionShop(s);
                                  setSingleActionType('suspend');
                                  setSingleActionReason('');
                                  setSingleActionCascadeOwner(false);
                                }}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                                title="Suspend this shop"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Suspend</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSingleActionShop(s);
                                  setSingleActionType('unsuspend');
                                  setSingleActionReason('');
                                  setSingleActionCascadeOwner(false);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                                title="Reactivate and unsuspend this shop"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Unsuspend</span>
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectShop(s);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                          {onDeleteShop && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetShop(s);
                              }}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                              title="Permanently delete this shop and its KYC records"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Batch Edit Status (Maintenance, Archived, etc.) */}
      {batchModal === 'edit_status' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !batchProcessing && setBatchModal(null)}
        >
          <div
            className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Sliders className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-100">Batch Edit Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apply a specific operational or administrative status across{' '}
              <strong className="text-amber-400 font-mono">{selectedIds.length}</strong> selected shop{selectedIds.length > 1 ? 's' : ''}.
              This immediately updates platform discovery, consumer search visibility, and operating parameters.
            </p>

            {/* Selected Shop Chips Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Target Outlets:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedShopsList.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-800 rounded font-medium"
                  >
                    <Store className="w-3 h-3 text-amber-400" />
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-500">({s.city})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Target Status Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Operational Status to Apply
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as ShopOperationalStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="Maintenance">🛠️ Maintenance — Temporary stall repairs / sanitization</option>
                <option value="Archived">📦 Archived — Decommissioned or delisted merchant outlet</option>
                <option value="Active">🟢 Active — Operational & verified on platform</option>
                <option value="Suspended">🔴 Suspended — Non-compliant or administrative pause</option>
                <option value="Under Inspection">🔍 Under Inspection — Food safety audit in progress</option>
                <option value="Seasonal Closure">❄️ Seasonal Closure — Closed for seasonal pause</option>
              </select>
            </div>

            {/* Operational Open/Close State Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Order Intake / Storefront Gate
              </label>
              <select
                value={targetIsOpen}
                onChange={(e) => setTargetIsOpen(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="keep">Keep Current Operating State</option>
                <option value="closed">Set to Currently Closed (No live tickets)</option>
                <option value="open">Set to Currently Open (Live ticket intake)</option>
              </select>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Administrative Reason & Notes (Optional)
              </label>
              <textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="e.g. Scheduled deep cleaning, license renewal hold, or platform archival."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchEditStatus}
                disabled={batchProcessing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Status...</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Apply Status to {selectedIds.length} Shops</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Approve Confirmation */}
      {batchModal === 'approve' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !batchProcessing && setBatchModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-100">Batch Approve & Activate Shops</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to batch approve and activate{' '}
              <strong className="text-emerald-400 font-mono">{selectedIds.length}</strong> shop{selectedIds.length > 1 ? 's' : ''}.
              They will be made active on the FoodFax discovery engine and permitted to accept customer orders.
            </p>

            {/* Selected Shop Chips Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Selected Outlets:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedShopsList.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-800 rounded font-medium"
                  >
                    <Store className="w-3 h-3 text-emerald-400" />
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-500">({s.city})</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Administrative Notes (Optional)
              </label>
              <textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="e.g. Batch verified documents and verified vendor permits."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchApprove}
                disabled={batchProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving {selectedIds.length}...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Batch Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Reject Confirmation */}
      {batchModal === 'reject' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !batchProcessing && setBatchModal(null)}
        >
          <div
            className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-100">Batch Reject / Suspend Shops</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to reject/suspend{' '}
              <strong className="text-rose-400 font-mono">{selectedIds.length}</strong> shop{selectedIds.length > 1 ? 's' : ''}.
              Their shops will be suspended, removed from customer discovery, and notified of the moderation reason.
            </p>

            {/* Selected Shop Chips Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Affected Outlets:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedShopsList.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-800 rounded font-medium"
                  >
                    <Store className="w-3 h-3 text-rose-400" />
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-500">({s.city})</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Reason for Rejection / Suspension
              </label>
              <select
                value={batchRejectionReason}
                onChange={(e) => setBatchRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="FSSAI License Expired or Missing">FSSAI License Expired or Missing</option>
                <option value="Health & Hygiene Non-Compliance">Health & Hygiene Non-Compliance</option>
                <option value="Incorrect Stall Location Details">Incorrect Stall Location Details</option>
                <option value="Incomplete Documentation">Incomplete Documentation</option>
                <option value="Unregistered Street Vendor / Illegal Stall">Unregistered Street Vendor / Illegal Stall</option>
                <option value="Violation of Platform Terms">Violation of Platform Terms</option>
                <option value="Quality Complaints Exceeded Threshold">Quality Complaints Exceeded Threshold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Feedback for Shop Owners (Optional)
              </label>
              <textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="Provide actionable guidance for owners to rectify their status..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchReject}
                disabled={batchProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing {selectedIds.length}...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Batch Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Suspend Confirmation */}
      {batchModal === 'suspend' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !batchProcessing && setBatchModal(null)}
        >
          <div
            className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-100">Batch Suspend Shops</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to suspend{' '}
              <strong className="text-rose-400 font-mono">{selectedIds.length}</strong> shop{selectedIds.length > 1 ? 's' : ''}.
              They will be delisted from platform discovery and customer ordering will be paused.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Target Outlets:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedShopsList.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-800 rounded font-medium"
                  >
                    <Store className="w-3 h-3 text-rose-400" />
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-500">({s.city})</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Suspension
              </label>
              <select
                value={batchRejectionReason}
                onChange={(e) => setBatchRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Violation of Platform Terms">Violation of Platform Terms</option>
                <option value="Health & Hygiene Non-Compliance">Health & Hygiene Non-Compliance</option>
                <option value="FSSAI License Expired or Missing">FSSAI License Expired or Missing</option>
                <option value="Quality Complaints Exceeded Threshold">Quality Complaints Exceeded Threshold</option>
                <option value="Unregistered Street Vendor / Illegal Stall">Unregistered Street Vendor / Illegal Stall</option>
                <option value="Administrative Review in Progress">Administrative Review in Progress</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="Details of audit or violation..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchSuspend}
                disabled={batchProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Suspending...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirm Suspension ({selectedIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Unsuspend Confirmation */}
      {batchModal === 'unsuspend' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !batchProcessing && setBatchModal(null)}
        >
          <div
            className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-100">Batch Reactivate / Unsuspend Shops</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to reactivate and unsuspend{' '}
              <strong className="text-emerald-400 font-mono">{selectedIds.length}</strong> shop{selectedIds.length > 1 ? 's' : ''}.
              They will be made active on the FoodFax platform and permitted to accept customer orders.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Outlets to Unsuspend:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedShopsList.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-800 rounded font-medium"
                  >
                    <Store className="w-3 h-3 text-emerald-400" />
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-500">({s.city})</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rectification or Administrative Note (Optional)
              </label>
              <textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="e.g. Audit cleared, compliance documentation verified."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchUnsuspend}
                disabled={batchProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reactivating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Unsuspend ({selectedIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Shop Suspend / Unsuspend Confirmation */}
      {singleActionShop && singleActionType && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !singleActionLoading && setSingleActionShop(null)}
        >
          <div
            className={`bg-slate-900 border ${
              singleActionType === 'suspend' ? 'border-rose-500/40' : 'border-emerald-500/40'
            } rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {singleActionType === 'suspend' ? (
                  <Ban className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="text-base font-bold text-slate-100">
                  {singleActionType === 'suspend' ? 'Suspend Shop' : 'Reactivate / Unsuspend Shop'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSingleActionShop(null)}
                disabled={singleActionLoading}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-slate-100 text-sm">{singleActionShop.name}</div>
              <div className="text-slate-400">{singleActionShop.city} • {singleActionShop.stall_type || 'Fast Food'}</div>
              <div className="font-mono text-[10px] text-slate-500">{singleActionShop.id}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {singleActionType === 'suspend'
                ? 'Suspending this shop immediately halts customer orders, pauses discoverability in search, and marks the outlet as suspended in records.'
                : 'Unsuspending this shop restores full operational status, re-enables live ordering, and marks the stall as active.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {singleActionType === 'suspend' ? 'Reason for Suspension *' : 'Reason / Audit Notes (Optional)'}
              </label>
              <input
                type="text"
                value={singleActionReason}
                onChange={(e) => setSingleActionReason(e.target.value)}
                placeholder={
                  singleActionType === 'suspend'
                    ? 'e.g. Hygiene audit non-compliance, missing health permit...'
                    : 'e.g. Inspection verified, merchant completed rectifications...'
                }
                required={singleActionType === 'suspend'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={singleActionCascadeOwner}
                onChange={(e) => setSingleActionCascadeOwner(e.target.checked)}
                className={`rounded border-slate-700 bg-slate-900 ${
                  singleActionType === 'suspend' ? 'text-rose-500' : 'text-emerald-500'
                } focus:ring-0`}
              />
              <span>
                {singleActionType === 'suspend'
                  ? 'Also suspend merchant owner account'
                  : 'Also unsuspend merchant owner account'}
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSingleActionShop(null)}
                disabled={singleActionLoading}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSingleAction}
                disabled={singleActionLoading || (singleActionType === 'suspend' && !singleActionReason.trim())}
                className={`px-4 py-2 ${
                  singleActionType === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                } disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm`}
              >
                {singleActionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : singleActionType === 'suspend' ? (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirm Suspension</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Reactivation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Shop Deletion */}
      {deleteTargetShop && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !deletingShop && setDeleteTargetShop(null)}
        >
          <div
            className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Delete Shop Permanently
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetShop(null)}
                disabled={deletingShop}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-slate-100 text-sm">{deleteTargetShop.name}</div>
              <div className="text-slate-400">{deleteTargetShop.address || deleteTargetShop.city || 'FoodFax Merchant'}</div>
              <div className="font-mono text-[10px] text-slate-500">ID: {deleteTargetShop.id}</div>
            </div>

            <p className="text-xs text-rose-300 leading-relaxed bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              <strong>Warning:</strong> Deleting this shop will permanently remove it from the database, along with its KYC verification requests, uploaded compliance documents, menu catalog, and platform listings. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetShop(null)}
                disabled={deletingShop}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!onDeleteShop || !deleteTargetShop) return;
                  setDeletingShop(true);
                  try {
                    await onDeleteShop(deleteTargetShop.id);
                    setDeleteTargetShop(null);
                  } finally {
                    setDeletingShop(false);
                  }
                }}
                disabled={deletingShop}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {deletingShop ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Shop Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Batch Shop Deletion */}
      {batchModal === 'delete' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !batchProcessing && setBatchModal(null)}
        >
          <div
            className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Batch Delete ({selectedIds.length}) Shops
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-rose-300 leading-relaxed bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              Are you sure you want to permanently delete <strong>{selectedIds.length}</strong> selected shops? All associated KYC requests, compliance documents, and catalog records will be permanently purged from the database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchModal(null)}
                disabled={batchProcessing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!onBatchAction) return;
                  setBatchProcessing(true);
                  try {
                    await onBatchAction(selectedIds, 'delete', { notes: batchNotes });
                    setSelectedIds([]);
                    setBatchModal(null);
                  } finally {
                    setBatchProcessing(false);
                  }
                }}
                disabled={batchProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {batchProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Batch Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
