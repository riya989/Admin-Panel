import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  ShoppingBag,
  MapPin,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import type { Customer } from '../../types/admin';

interface CustomersListViewProps {
  customers: Customer[];
  loading: boolean;
  onRefresh: () => void;
  onToggleUserStatus?: (
    userId: string,
    action: 'suspend' | 'unsuspend',
    reason: string
  ) => Promise<void>;
  onDeleteCustomer?: (customerId: string, reason?: string) => Promise<void>;
}

export const CustomersListView: React.FC<CustomersListViewProps> = ({
  customers,
  loading,
  onRefresh,
  onToggleUserStatus,
  onDeleteCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Single Action Modal State
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null);
  const [customerActionType, setCustomerActionType] = useState<'suspend' | 'unsuspend' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Customer Delete Modal State
  const [customerDeleteTarget, setCustomerDeleteTarget] = useState<Customer | null>(null);
  const [customerDeleteReason, setCustomerDeleteReason] = useState('');
  const [customerDeleteLoading, setCustomerDeleteLoading] = useState(false);

  const filteredCustomers = customers.filter((c) => {
    const isActive = c.is_active !== false;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'suspended' && isActive) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  const handleExecuteCustomerAction = async () => {
    if (!onToggleUserStatus || !targetCustomer || !customerActionType) return;
    setActionLoading(true);
    try {
      await onToggleUserStatus(targetCustomer.id, customerActionType, actionReason);
      setTargetCustomer(null);
      setCustomerActionType(null);
      setActionReason('');
      if (selectedCustomer && selectedCustomer.id === targetCustomer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          is_active: customerActionType === 'unsuspend',
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
            <Users className="w-5 h-5 text-sky-400" />
            <span>Platform Customers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered food consumers, order histories, and locality preferences.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh customers"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, mobile, email, city..."
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

        {/* Status Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-48 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Customer Statuses</option>
            <option value="active">Active Consumers</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <span>Loading customer records...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No customer records found matching filter options.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Contact Phone</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Location / City</th>
                  <th className="px-4 py-3.5">Orders Placed</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Joined Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCustomers.map((cust) => {
                  const isActive = cust.is_active !== false;
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                        {cust.full_name || 'Guest User'}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-300 font-semibold">
                        {cust.phone || 'N/A'}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-400">
                        {cust.email || 'Phone verified'}
                      </td>
                      <td className="px-4 py-4">
                        <span>{cust.area || cust.city || 'Mumbai'}</span>
                      </td>
                      <td className="px-4 py-4 font-mono tabular-nums text-slate-200">
                        <strong className="text-emerald-400">{cust.order_count || 0}</strong> orders
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-400">
                        {new Date(cust.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {onToggleUserStatus && (
                            isActive ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetCustomer(cust);
                                  setCustomerActionType('suspend');
                                  setActionReason('');
                                }}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                                title="Suspend this customer account"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetCustomer(cust);
                                  setCustomerActionType('unsuspend');
                                  setActionReason('');
                                }}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                                title="Reactivate and unsuspend this customer account"
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
                              setSelectedCustomer(cust);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                          {onDeleteCustomer && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomerDeleteTarget(cust);
                                setCustomerDeleteReason('');
                              }}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                              title="Permanently delete this customer account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-sm">{selectedCustomer.full_name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Status Card */}
            <div className={`p-3.5 rounded-xl border ${
              selectedCustomer.is_active !== false
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-rose-950/30 border-rose-500/30'
            } flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-2.5">
                {selectedCustomer.is_active !== false ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-100">
                    Account Status: {selectedCustomer.is_active !== false ? 'ACTIVE' : 'SUSPENDED'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedCustomer.is_active !== false
                      ? 'Consumer can place orders and access payment options.'
                      : 'Account suspended; consumer cannot place live platform orders.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onToggleUserStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCustomer(selectedCustomer);
                      setCustomerActionType(selectedCustomer.is_active !== false ? 'suspend' : 'unsuspend');
                      setActionReason('');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                      selectedCustomer.is_active !== false
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    {selectedCustomer.is_active !== false ? 'Suspend' : 'Unsuspend'}
                  </button>
                )}
                {onDeleteCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerDeleteTarget(selectedCustomer);
                      setCustomerDeleteReason('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"
                    title="Delete customer account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Customer ID:</span>
                <span className="font-mono text-slate-300">{selectedCustomer.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-300">{selectedCustomer.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Address / Area:</span>
                <span className="text-slate-200">{selectedCustomer.address || selectedCustomer.area || 'Mumbai Region'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Total Orders Placed:</span>
                <span className="font-mono tabular-nums font-bold text-emerald-400">{selectedCustomer.order_count || 0}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Customer Account Action */}
      {targetCustomer && customerActionType && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !actionLoading && setTargetCustomer(null)}
        >
          <div
            className={`bg-slate-900 border ${
              customerActionType === 'suspend' ? 'border-rose-500/40' : 'border-emerald-500/40'
            } rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {customerActionType === 'suspend' ? (
                  <Ban className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="text-base font-bold text-slate-100">
                  {customerActionType === 'suspend' ? 'Suspend Consumer Account' : 'Reactivate Consumer Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetCustomer(null)}
                disabled={actionLoading}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-slate-100 text-sm">{targetCustomer.full_name || 'Guest User'}</div>
              <div className="text-slate-400">{targetCustomer.phone || targetCustomer.email}</div>
              <div className="font-mono text-[10px] text-slate-500">{targetCustomer.id}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {customerActionType === 'suspend'
                ? 'Suspending this customer account restricts them from placing new food orders or participating in platform promotions.'
                : 'Unsuspending this customer account restores normal ordering and checkout privileges.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {customerActionType === 'suspend' ? 'Reason for Account Suspension *' : 'Reason / Notes (Optional)'}
              </label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  customerActionType === 'suspend'
                    ? 'e.g. Fraudulent disputes, payment policy violations...'
                    : 'e.g. Dispute settled, account verified...'
                }
                required={customerActionType === 'suspend'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTargetCustomer(null)}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCustomerAction}
                disabled={actionLoading || (customerActionType === 'suspend' && !actionReason.trim())}
                className={`px-4 py-2 ${
                  customerActionType === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                } disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm`}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : customerActionType === 'suspend' ? (
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

      {/* Confirmation Modal for Customer Deletion */}
      {customerDeleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !customerDeleteLoading && setCustomerDeleteTarget(null)}
        >
          <div
            className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Delete Customer Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomerDeleteTarget(null)}
                disabled={customerDeleteLoading}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-slate-100 text-sm">{customerDeleteTarget.full_name || 'Guest User'}</div>
              <div className="text-slate-400">{customerDeleteTarget.phone || customerDeleteTarget.email || 'No contact specified'}</div>
              <div className="font-mono text-[10px] text-slate-500">ID: {customerDeleteTarget.id}</div>
            </div>

            <p className="text-xs text-rose-300 leading-relaxed bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              <strong>Warning:</strong> Deleting this customer account will permanently remove their records, order links, and consumer profile from the database. This action cannot be undone.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason / Deletion Notes (Optional)
              </label>
              <input
                type="text"
                value={customerDeleteReason}
                onChange={(e) => setCustomerDeleteReason(e.target.value)}
                placeholder="e.g. User request, duplicate account, test profile..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCustomerDeleteTarget(null)}
                disabled={customerDeleteLoading}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!onDeleteCustomer || !customerDeleteTarget) return;
                  customerDeleteTarget && setCustomerDeleteLoading(true);
                  try {
                    await onDeleteCustomer(customerDeleteTarget.id, customerDeleteReason);
                    if (selectedCustomer?.id === customerDeleteTarget.id) {
                      setSelectedCustomer(null);
                    }
                    setCustomerDeleteTarget(null);
                  } finally {
                    setCustomerDeleteLoading(false);
                  }
                }}
                disabled={customerDeleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {customerDeleteLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Customer Permanently</span>
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
