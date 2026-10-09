import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  Banknote,
  Utensils,
  Truck,
  RotateCcw,
} from 'lucide-react';
import type { Order } from '../../types/admin';

interface OrdersMonitorViewProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
  onOverrideStatus: (orderId: string, newStatus: string, reason: string) => Promise<void>;
}

const highlightMatch = (text?: string | null, query?: string) => {
  if (!text) return '';
  if (!query || !query.trim()) return text;
  const q = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return text;
  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);
  return (
    <>
      {before}
      <mark className="bg-amber-400/25 text-amber-200 px-0.5 rounded font-bold">
        {match}
      </mark>
      {after}
    </>
  );
};

export const OrdersMonitorView: React.FC<OrdersMonitorViewProps> = ({
  orders,
  loading,
  onRefresh,
  onOverrideStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [overrideModal, setOverrideModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('COMPLETED');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const isSearching = search.trim().length > 0;
  const hasActiveFilters =
    isSearching ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    typeFilter !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setTypeFilter('all');
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.order_status?.toLowerCase() !== statusFilter.toLowerCase())
      return false;
    if (
      paymentFilter !== 'all' &&
      o.payment_method?.toLowerCase() !== paymentFilter.toLowerCase()
    )
      return false;
    if (typeFilter !== 'all' && o.order_type?.toLowerCase() !== typeFilter.toLowerCase())
      return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchesId = o.id?.toLowerCase().includes(q);
      const matchesToken = o.token_number?.toLowerCase().includes(q);
      const matchesShop = o.shop_name?.toLowerCase().includes(q);
      const matchesCustomer = o.customer_name?.toLowerCase().includes(q);
      const matchesPhone = o.customer_phone?.toLowerCase().includes(q);
      const matchesInstructions = o.instructions?.toLowerCase().includes(q);
      return (
        matchesId ||
        matchesToken ||
        matchesShop ||
        matchesCustomer ||
        matchesPhone ||
        matchesInstructions
      );
    }
    return true;
  });

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !overrideReason.trim()) return;
    setOverrideLoading(true);
    try {
      await onOverrideStatus(selectedOrder.id, newStatus, overrideReason.trim());
      setOverrideModal(false);
      setSelectedOrder(null);
      setOverrideReason('');
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
            <span>Platform Orders Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of food stall transactions, token numbers, and fulfillment across the network.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh orders feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID, token, shop, customer..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Order Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready for Pickup</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Payment Methods</option>
              <option value="PAY_ONLINE">Online Payment (UPI/Cards)</option>
              <option value="CASH_AT_COUNTER">Cash at Counter</option>
            </select>
          </div>

          {/* Order Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Modalities</option>
              <option value="TAKEAWAY">Takeaway / Pickup</option>
              <option value="DINE_IN">Table Service / Dine In</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Result Count Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Showing <strong className="text-slate-100 font-mono">{filteredOrders.length}</strong> of{' '}
              <strong className="text-slate-100 font-mono">{orders.length}</strong> order{orders.length === 1 ? '' : 's'}
            </span>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center flex-wrap gap-2">
              {isSearching && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/60 border border-sky-800/60 rounded-full text-[11px] text-sky-300">
                  <span>Query: &ldquo;{search}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="hover:text-sky-100 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] text-slate-200">
                  <span>Status: {statusFilter}</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="hover:text-slate-100 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {paymentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] text-slate-200">
                  <span>Payment: {paymentFilter}</span>
                  <button
                    type="button"
                    onClick={() => setPaymentFilter('all')}
                    className="hover:text-slate-100 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] text-slate-200">
                  <span>Type: {typeFilter}</span>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('all')}
                    className="hover:text-slate-100 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium ml-1 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <span>Synchronizing orders from Supabase...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-200 text-sm">No orders matching criteria</p>
            <p className="text-slate-500 text-xs mt-1">
              {isSearching
                ? `No orders matched your lookup for "${search}". Try searching by order UUID, token number, customer, or stall name.`
                : 'No orders found matching the selected filter options.'}
            </p>
          </div>
          {hasActiveFilters && (
            <div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Token & ID</th>
                  <th className="px-4 py-3.5">Food Outlet</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Total GMV</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Order Type</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-xs text-emerald-400 block group-hover:underline">
                        {highlightMatch(ord.token_number, search)}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 block">
                        {highlightMatch(ord.id, search)}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-200">
                      {highlightMatch(ord.shop_name, search)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-slate-200 font-medium">
                        {highlightMatch(ord.customer_name, search)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {highlightMatch(ord.customer_phone, search)}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-slate-100 tabular-nums">
                      ₹{ord.total}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {ord.payment_method === 'PAY_ONLINE' ? (
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Banknote className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="font-mono text-[11px]">{ord.payment_method}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{ord.payment_status}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-mono text-[11px] text-slate-400">{ord.order_type}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                          ord.order_status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : ord.order_status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {ord.order_status}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-mono text-[11px] text-slate-400 tabular-nums">
                      <div>{new Date(ord.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    Order {selectedOrder.token_number}
                  </h3>
                  <span className="font-mono text-[10px] text-slate-500">{selectedOrder.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Shop:</span>
                <span className="font-semibold text-slate-200">{selectedOrder.shop_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Customer:</span>
                <span className="text-slate-200">{selectedOrder.customer_name} ({selectedOrder.customer_phone})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Payment:</span>
                <span className="font-mono text-slate-200">{selectedOrder.payment_method} · {selectedOrder.payment_status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="font-mono text-emerald-400 font-semibold">{selectedOrder.order_status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Placed At:</span>
                <span className="font-mono text-slate-300">{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 font-semibold block mb-2">Itemized Basket:</span>
                  <div className="space-y-1.5 bg-slate-950 border border-slate-800 rounded-lg p-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-slate-300">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="font-mono text-slate-200">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2 text-sm font-bold">
                <span className="text-slate-300">Total Settlement:</span>
                <span className="font-mono text-emerald-400">₹{selectedOrder.total}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOverrideModal(true)}
                className="px-3 py-1.5 border border-amber-800/60 hover:bg-amber-950/40 text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Admin Status Override</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Confirmation Modal */}
      {overrideModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Administrative Order Override</h3>
                <p className="text-xs text-slate-400">Override requires strict justification and logs an audit record</p>
              </div>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Target Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY">READY</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mandatory Override Justification Reason
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State reason: e.g. Customer confirmed collection via customer support hotline."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOverrideModal(false)}
                  disabled={overrideLoading}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading || !overrideReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {overrideLoading ? 'Overriding...' : 'Execute Override & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
