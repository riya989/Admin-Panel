import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Store,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  RefreshCw,
  X,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import type { UserProfile, Shop } from '../../types/admin';

interface OwnerWithShops extends UserProfile {
  shopCount: number;
  shops: Array<{ id: string; name: string; is_active: boolean; city?: string }>;
}

interface OwnersListViewProps {
  owners: OwnerWithShops[];
  loading: boolean;
  onRefresh: () => void;
  onSelectShopId: (shopId: string) => void;
  onToggleUserStatus?: (
    userId: string,
    action: 'suspend' | 'unsuspend',
    reason: string,
    cascadeShops?: boolean
  ) => Promise<void>;
}

export const OwnersListView: React.FC<OwnersListViewProps> = ({
  owners,
  loading,
  onRefresh,
  onSelectShopId,
  onToggleUserStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedOwner, setSelectedOwner] = useState<OwnerWithShops | null>(null);

  // Single Owner Action State (Row or Modal)
  const [targetOwner, setTargetOwner] = useState<OwnerWithShops | null>(null);
  const [ownerActionType, setOwnerActionType] = useState<'suspend' | 'unsuspend' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [cascadeShops, setCascadeShops] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredOwners = owners.filter((o) => {
    if (statusFilter === 'active' && !o.is_active) return false;
    if (statusFilter === 'suspended' && o.is_active) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.full_name?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone?.includes(q)
    );
  });

  const handleExecuteOwnerAction = async () => {
    if (!onToggleUserStatus || !targetOwner || !ownerActionType) return;
    setActionLoading(true);
    try {
      await onToggleUserStatus(targetOwner.id, ownerActionType, actionReason, cascadeShops);
      setTargetOwner(null);
      setOwnerActionType(null);
      setActionReason('');
      setCascadeShops(true);
      if (selectedOwner && selectedOwner.id === targetOwner.id) {
        setSelectedOwner({
          ...selectedOwner,
          is_active: ownerActionType === 'unsuspend',
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Registered Shop Owners</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of merchant accounts operating food stalls and restaurants on FoodFax.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh owners"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by owner name, email, or mobile..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Account Status Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-48 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Merchants</option>
            <option value="suspended">Suspended Merchants</option>
          </select>
        </div>
      </div>

      {/* Grid / Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <span>Fetching owner profiles...</span>
        </div>
      ) : filteredOwners.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No shop owners found matching filter options.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Owner Name</th>
                  <th className="px-4 py-3.5">Contact Email</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Shops Owned</th>
                  <th className="px-4 py-3.5">Registered</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOwners.map((owner) => (
                  <tr
                    key={owner.id}
                    onClick={() => setSelectedOwner(owner)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {owner.full_name || 'Unnamed Merchant'}
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-300">
                      {owner.email || 'N/A'}
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-300 font-semibold">
                      {owner.phone || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono tabular-nums font-bold text-slate-200">
                        {owner.shopCount}
                      </span>
                      <span className="text-slate-500 ml-1">outlet(s)</span>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-400">
                      {new Date(owner.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                          owner.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {owner.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {onToggleUserStatus && (
                          owner.is_active ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetOwner(owner);
                                setOwnerActionType('suspend');
                                setActionReason('');
                                setCascadeShops(true);
                              }}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                              title="Suspend this merchant account"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetOwner(owner);
                                setOwnerActionType('unsuspend');
                                setActionReason('');
                                setCascadeShops(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                              title="Reactivate and unsuspend this merchant account"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Unsuspend</span>
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOwner(owner);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Owner Profile Detail Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">{selectedOwner.full_name || 'Owner Profile'}</h3>
              </div>
              <button
                onClick={() => setSelectedOwner(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Status Card & Fast Toggle */}
            <div className={`p-3.5 rounded-xl border ${
              selectedOwner.is_active
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-rose-950/30 border-rose-500/30'
            } flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-2.5">
                {selectedOwner.is_active ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-100">
                    Account Status: {selectedOwner.is_active ? 'ACTIVE' : 'SUSPENDED'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedOwner.is_active
                      ? 'Merchant has full access to vendor dashboard and live operations.'
                      : 'Merchant account is paused; stall management and ordering are suspended.'}
                  </div>
                </div>
              </div>

              {onToggleUserStatus && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetOwner(selectedOwner);
                    setOwnerActionType(selectedOwner.is_active ? 'suspend' : 'unsuspend');
                    setActionReason('');
                    setCascadeShops(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                    selectedOwner.is_active
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {selectedOwner.is_active ? 'Suspend Account' : 'Reactivate / Unsuspend'}
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono text-slate-200">{selectedOwner.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-200">{selectedOwner.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedOwner.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Owned Shops Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-sky-400" />
                <span>Owned Outlets ({selectedOwner.shops?.length || 0})</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOwner.shops?.map((sh) => (
                  <div
                    key={sh.id}
                    onClick={() => {
                      setSelectedOwner(null);
                      onSelectShopId(sh.id);
                    }}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-200 block">{sh.name}</span>
                      <span className="text-[11px] text-slate-500">{sh.city || 'Mumbai'}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        sh.is_active ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                      }`}
                    >
                      {sh.is_active ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOwner(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Merchant Account Action */}
      {targetOwner && ownerActionType && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !actionLoading && setTargetOwner(null)}
        >
          <div
            className={`bg-slate-900 border ${
              ownerActionType === 'suspend' ? 'border-rose-500/40' : 'border-emerald-500/40'
            } rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {ownerActionType === 'suspend' ? (
                  <Ban className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="text-base font-bold text-slate-100">
                  {ownerActionType === 'suspend' ? 'Suspend Merchant Account' : 'Reactivate / Unsuspend Merchant Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetOwner(null)}
                disabled={actionLoading}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-slate-100 text-sm">{targetOwner.full_name || 'Unnamed Merchant'}</div>
              <div className="text-slate-400">{targetOwner.email || targetOwner.phone}</div>
              <div className="font-mono text-[10px] text-slate-500">{targetOwner.id} • {targetOwner.shopCount} outlet(s) owned</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {ownerActionType === 'suspend'
                ? 'Suspending this merchant account locks login access, blocks new stall registrations, and optionally halts all owned food stalls.'
                : 'Unsuspending this merchant account restores authentication access and optionally reactivates their food stalls.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {ownerActionType === 'suspend' ? 'Reason for Account Suspension *' : 'Reason / Justification (Optional)'}
              </label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  ownerActionType === 'suspend'
                    ? 'e.g. Terms violation, fraudulent listings, persistent hygiene violations...'
                    : 'e.g. Audit cleared, compliance documentation submitted...'
                }
                required={ownerActionType === 'suspend'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {targetOwner.shopCount > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={cascadeShops}
                  onChange={(e) => setCascadeShops(e.target.checked)}
                  className={`rounded border-slate-700 bg-slate-900 ${
                    ownerActionType === 'suspend' ? 'text-rose-500' : 'text-emerald-500'
                  } focus:ring-0`}
                />
                <span>
                  {ownerActionType === 'suspend'
                    ? `Also suspend all ${targetOwner.shopCount} shop outlet(s) owned by this merchant`
                    : `Also reactivate all ${targetOwner.shopCount} shop outlet(s) owned by this merchant`}
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTargetOwner(null)}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteOwnerAction}
                disabled={actionLoading || (ownerActionType === 'suspend' && !actionReason.trim())}
                className={`px-4 py-2 ${
                  ownerActionType === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                } disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm`}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : ownerActionType === 'suspend' ? (
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
    </div>
  );
};
