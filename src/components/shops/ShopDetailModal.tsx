import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Truck,
  Building2,
  MapPin,
  Clock,
  Phone,
  User,
  ShoppingBag,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Ban,
  CheckCircle2,
  UtensilsCrossed,
  History,
  Activity,
  ArrowRight,
  ChevronRight,
  Wrench,
  Sliders,
  Trash2,
  Eye,
} from 'lucide-react';
import { GoogleMapPreview } from '../common/GoogleMapPreview';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import type { Shop, UserProfile, Order, MenuItem, ShopVerificationDocument, AdminAuditLog } from '../../types/admin';
import { ShopActivityTimeline } from './ShopActivityTimeline';
import { fetchShopAuditLogs, ensureDefaultKycDocuments, fetchShopKycDocuments, getDocumentTypeLabel } from '../../lib/api';

interface ShopDetailModalProps {
  shop: Shop | null;
  owner: UserProfile | null;
  menuItems: MenuItem[];
  orders: Order[];
  documents: ShopVerificationDocument[];
  auditLogs?: AdminAuditLog[];
  onClose: () => void;
  onToggleStatus: (
    shopId: string,
    action: 'activate' | 'deactivate' | 'suspend' | 'unsuspend',
    reason?: string,
    options?: { suspendOwnerAccount?: boolean; unsuspendOwnerAccount?: boolean }
  ) => Promise<void>;
  onDeleteShop?: (shopId: string, reason?: string) => Promise<void>;
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  shop,
  owner,
  menuItems,
  orders,
  documents,
  auditLogs = [],
  onClose,
  onToggleStatus,
  onDeleteShop,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'menu' | 'orders' | 'documents'>('overview');
  const [suspending, setSuspending] = useState(false);
  const [unsuspending, setUnsuspending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [unsuspendReason, setUnsuspendReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [includeOwnerAccount, setIncludeOwnerAccount] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [auditLogsState, setAuditLogsState] = useState<AdminAuditLog[]>(auditLogs || []);
  const [previewDoc, setPreviewDoc] = useState<ShopVerificationDocument | null>(null);
  const [docList, setDocList] = useState<ShopVerificationDocument[]>(() => {
    const raw = documents || [];
    return raw.length > 0 ? raw : ensureDefaultKycDocuments(shop, `req_${shop?.id}_v1`);
  });

  // Query kyc_documents table and shop record fallback dynamically
  useEffect(() => {
    if (!shop?.id) return;
    let isMounted = true;
    fetchShopKycDocuments(shop.id, shop, `req_${shop.id}_v1`)
      .then((docs) => {
        if (isMounted && Array.isArray(docs) && docs.length > 0) {
          setDocList(docs);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [shop?.id]);

  // Synchronize audit logs state with prop or fetch if empty
  useEffect(() => {
    if (auditLogs && auditLogs.length > 0) {
      setAuditLogsState(auditLogs);
    } else if (shop?.id) {
      fetchShopAuditLogs(shop.id)
        .then((data) => {
          if (Array.isArray(data)) setAuditLogsState(data);
        })
        .catch(() => {});
    }
  }, [auditLogs, shop?.id]);

  // Esc key listener to dismiss modal or nested suspend prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (suspending) {
          setSuspending(false);
        } else if (unsuspending) {
          setUnsuspending(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suspending, unsuspending, onClose]);

  if (!shop) return null;

  const handleAction = async (action: 'activate' | 'deactivate' | 'suspend' | 'unsuspend') => {
    setLoadingAction(true);
    try {
      const reason = action === 'suspend' ? suspendReason : unsuspendReason;
      await onToggleStatus(shop.id, action, reason, {
        suspendOwnerAccount: action === 'suspend' && includeOwnerAccount,
        unsuspendOwnerAccount: (action === 'unsuspend' || action === 'activate') && includeOwnerAccount,
      });
      setSuspending(false);
      setUnsuspending(false);
      setSuspendReason('');
      setUnsuspendReason('');
      setIncludeOwnerAccount(false);

      // Immediately refresh audit trail to display the new action
      try {
        const fresh = await fetchShopAuditLogs(shop.id);
        if (Array.isArray(fresh)) {
          setAuditLogsState(fresh);
        }
      } catch {
        // Non-fatal
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Helper to format short time ago
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
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400">
              {shop.is_mobile_stall ? <Truck className="w-5 h-5 text-amber-400" /> : <Building2 className="w-5 h-5 text-sky-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-base">{shop.name}</h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                    shop.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  {shop.is_active ? 'ACTIVE' : 'INACTIVE / SUSPENDED'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${shop.is_open ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 bg-slate-800'}`}>
                  {shop.is_open ? 'OPEN NOW' : 'CLOSED'}
                </span>
                {shop.operational_status && shop.operational_status !== 'Active' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    {shop.operational_status.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                <span>ID: {shop.id}</span>
                <span> · </span>
                <span>Registered: {new Date(shop.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-4 text-xs font-medium overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Location
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timeline' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Timeline</span>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded">{auditLogsState.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'menu' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Menu Items</span>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded">{menuItems.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Recent Orders</span>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded">{orders.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'documents' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>KYC Compliance</span>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded">{docList.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Suspension Warning Banner */}
              {!shop.is_active && (
                <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-rose-200">Shop is Currently Suspended</div>
                    <div className="text-rose-300/80 text-[11px]">
                      This outlet is deactivated and delisted from customer ordering on the FoodFax platform.
                      {owner?.is_active === false ? ' The associated merchant owner account is also suspended.' : ''}
                    </div>
                  </div>
                </div>
              )}

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs space-y-2.5">
                  <h3 className="text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Owner & Contact</span>
                  </h3>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Legal Owner</span>
                    <span className="font-semibold text-slate-200">{owner?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 items-center">
                    <span className="text-slate-500">Owner Account</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                        owner?.is_active === false
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      }`}
                    >
                      {owner?.is_active === false ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Email</span>
                    <span className="font-mono text-slate-200">{owner?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-mono text-slate-200">{shop.phone || owner?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Stall Type</span>
                    <span className="text-slate-200">{shop.stall_type || 'Fast Food & QSR'}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs space-y-2.5">
                  <h3 className="text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Operations & Delivery</span>
                  </h3>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Operating Hours</span>
                    <span className="font-mono text-slate-200">{shop.opening_time || '10:00 AM'} - {shop.closing_time || '11:00 PM'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Table Service</span>
                    <span className="text-slate-200">{shop.table_service_available ? 'Available' : 'Takeaway Only'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Delivery Status</span>
                    <span className="text-slate-200">{shop.accepts_delivery ? `Radius: ${shop.delivery_radius_km} km` : 'Pickup only'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Average Preparation</span>
                    <span className="font-mono text-slate-200">{shop.preparation_time_minutes || '5-10'} mins</span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline Highlights Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Recent Activity & Audit Timeline Highlights
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>View Full Timeline ({auditLogsState.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {auditLogsState.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800/80">
                    No historical activity logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {auditLogsState.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.action.includes('APPROV') || item.action.includes('ACTIVATE')
                                ? 'bg-emerald-400'
                                : item.action.includes('SUSPEND') || item.action.includes('REJECT')
                                ? 'bg-rose-400'
                                : item.action.includes('MAINTENANCE')
                                ? 'bg-amber-400'
                                : 'bg-sky-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200 truncate">{item.action.replace(/_/g, ' ')}</span>
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                                {item.target_type}
                              </span>
                            </div>
                            {item.reason && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.reason}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-[10px] text-slate-400 block">{formatTimeAgo(item.created_at)}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {item.admin_email ? item.admin_email.split('@')[0] : 'Admin'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Location & Map Preview */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Shop Geolocation</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {shop.area}, {shop.city} - {shop.pincode}
                  </span>
                </div>
                <GoogleMapPreview
                  latitude={shop.latitude}
                  longitude={shop.longitude}
                  shopName={shop.name}
                  address={shop.address}
                  className="h-56 w-full"
                />
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <ShopActivityTimeline
              shop={shop}
              initialLogs={auditLogsState}
              onRefreshParent={async () => {
                const fresh = await fetchShopAuditLogs(shop.id);
                if (Array.isArray(fresh)) {
                  setAuditLogsState(fresh);
                }
              }}
            />
          )}

          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                  <span>Configured Menu Items</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">{menuItems.length} items cataloged</span>
              </div>

              {menuItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
                  No menu items listed for this shop.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-semibold text-xs text-slate-200">{item.name}</span>
                        </div>
                        <span className="font-mono text-xs text-emerald-400 font-bold mt-1 block">₹{item.price}</span>
                        <span className="text-[11px] text-slate-500 mt-1 block">{item.preparation_minutes ? `${item.preparation_minutes} mins` : 'Fast'}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.is_available ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-500 bg-slate-900'}`}>
                        {item.is_available ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  <span>Recent Shop Orders</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">{orders.length} orders logged</span>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
                  No order history recorded for this shop yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  {orders.map((ord) => (
                    <div key={ord.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400">{ord.token_number}</span>
                          <span className="text-slate-300 font-medium">{ord.customer_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({ord.customer_phone})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {new Date(ord.created_at).toLocaleString()} · {ord.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200 block">₹{ord.total}</span>
                        <span className="font-mono text-[10px] text-emerald-400">{ord.order_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (() => {
            const effectiveDocs =
              docList.length > 0
                ? docList
                : ensureDefaultKycDocuments(shop, `req_${shop.id}_v1`);
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Compliance & KYC Documents</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">{effectiveDocs.length} files attached</span>
                </div>

                {effectiveDocs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
                    No documents found for this shop.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {effectiveDocs.map((d) => {
                      const statusBadge =
                        d.status === 'Verified' || d.status === 'Approved' || d.status === 'approved'
                          ? 'Approved'
                          : d.status === 'Rejected' || d.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending';

                      return (
                        <div key={d.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-slate-200">{d.document_name}</span>
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                                    statusBadge === 'Approved'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                      : statusBadge === 'Rejected'
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                  }`}
                                >
                                  {statusBadge}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono flex-wrap">
                                <span className="text-slate-300 font-medium">
                                  {getDocumentTypeLabel(d.document_type, d.document_name)}
                                </span>
                                {d.document_number && (
                                  <>
                                    <span>·</span>
                                    <span className="text-emerald-400 font-semibold">{d.document_number}</span>
                                  </>
                                )}
                                <span>·</span>
                                <span>{d.file_size ? `${Math.round(d.file_size / 1024)} KB` : 'PDF'}</span>
                                <span>·</span>
                                <span>Uploaded: {new Date(d.uploaded_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(d)}
                              className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs text-slate-200 font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View / Preview Document</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer Actions: Suspend / Unsuspend with Safety Governance & Account Cascade */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Safety Governance: Arbitrary hard deletion is prohibited; prefer suspension.
          </div>

          {!suspending && !unsuspending ? (
            <div className="flex items-center gap-2">
              {shop.is_active ? (
                <button
                  type="button"
                  onClick={() => {
                    setSuspending(true);
                    setUnsuspending(false);
                    setIncludeOwnerAccount(false);
                  }}
                  disabled={loadingAction}
                  className="px-4 py-2 border border-rose-800/60 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  <span>Suspend Shop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUnsuspending(true);
                    setSuspending(false);
                    setIncludeOwnerAccount(owner?.is_active === false);
                  }}
                  disabled={loadingAction}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reactivate / Unsuspend</span>
                </button>
              )}
              {onDeleteShop && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleting(true);
                    setSuspending(false);
                    setUnsuspending(false);
                  }}
                  disabled={loadingAction}
                  className="px-4 py-2 border border-rose-800/60 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Permanently delete this shop and all its data"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Shop</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          ) : deleting ? (
            <div className="flex flex-col gap-2.5 w-full sm:max-w-xl bg-slate-900 border border-rose-900/60 rounded-xl p-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Permanently Delete Shop: {shop.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDeleting(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] text-rose-300/90 leading-relaxed bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                <strong>Warning:</strong> Deleting this shop will permanently remove it from the database, along with all associated KYC verification requests, uploaded compliance documents, menu items, and catalog records. This cannot be undone.
              </p>

              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason for deletion (optional)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleting(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!onDeleteShop || !shop) return;
                    setLoadingAction(true);
                    try {
                      await onDeleteShop(shop.id, deleteReason);
                      onClose();
                    } finally {
                      setLoadingAction(false);
                    }
                  }}
                  disabled={loadingAction}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5"
                >
                  {loadingAction ? 'Deleting...' : 'Confirm Permanent Deletion'}
                </button>
              </div>
            </div>
          ) : suspending ? (
            <div className="flex flex-col gap-2.5 w-full sm:max-w-xl bg-slate-900 border border-rose-900/60 rounded-xl p-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Suspend Shop: {shop.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSuspending(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Reason for suspension (e.g. hygiene violation, customer complaints, license audit)..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />

              {owner && (
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 select-none bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800">
                  <input
                    type="checkbox"
                    checked={includeOwnerAccount}
                    onChange={(e) => setIncludeOwnerAccount(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
                  />
                  <span>
                    Also suspend merchant owner account (<strong>{owner.full_name || owner.email || 'Owner'}</strong>)
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSuspending(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('suspend')}
                  disabled={loadingAction || !suspendReason.trim()}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  {loadingAction ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 w-full sm:max-w-xl bg-slate-900 border border-emerald-900/60 rounded-xl p-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reactivate / Unsuspend Shop: {shop.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUnsuspending(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={unsuspendReason}
                onChange={(e) => setUnsuspendReason(e.target.value)}
                placeholder="Reason or rectification notes (e.g. hygiene rectifications verified, appeal granted)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />

              {owner && (
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 select-none bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800">
                  <input
                    type="checkbox"
                    checked={includeOwnerAccount}
                    onChange={(e) => setIncludeOwnerAccount(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <span>
                    Also unsuspend merchant owner account (<strong>{owner.full_name || owner.email || 'Owner'}</strong>)
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUnsuspending(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('unsuspend')}
                  disabled={loadingAction}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  {loadingAction ? 'Reactivating...' : 'Confirm Reactivation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
