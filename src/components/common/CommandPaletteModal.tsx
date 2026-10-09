import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Users,
  UserCheck,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  ScrollText,
  Settings,
  RefreshCw,
  Download,
  FileDown,
  Keyboard,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
} from 'lucide-react';
import type { AdminTab } from '../layout/AdminLayout';
import type { Shop, ShopVerificationRequest, Order } from '../../types/admin';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AdminTab) => void;
  onSelectShop: (shop: Shop) => void;
  onSelectVerification: (request: ShopVerificationRequest) => void;
  onRefreshData: () => void;
  onExportShopsCsv: () => void;
  onExportVerificationsCsv: () => void;
  onExportShopsPdf?: () => void;
  onExportVerificationsPdf?: () => void;
  onOpenShortcuts: () => void;
  shops: Shop[];
  verifications: ShopVerificationRequest[];
  orders: Order[];
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Shops' | 'KYC Verifications' | 'Orders' | 'Actions';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectShop,
  onSelectVerification,
  onRefreshData,
  onExportShopsCsv,
  onExportVerificationsCsv,
  onExportShopsPdf,
  onExportVerificationsPdf,
  onOpenShortcuts,
  shops,
  verifications,
  orders,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navTabs: { id: AdminTab; title: string; subtitle: string; icon: React.ElementType }[] = [
    { id: 'dashboard', title: 'Dashboard', subtitle: 'Overview metrics & platform revenue', icon: LayoutDashboard },
    { id: 'verification', title: 'KYC & Verification', subtitle: 'Review shop registrations & food safety permits', icon: ShieldCheck },
    { id: 'shops', title: 'All Shops Directory', subtitle: 'Browse mobile street vendors & food outlets', icon: Store },
    { id: 'owners', title: 'Shop Owners', subtitle: 'Vendor contact accounts & store ownership', icon: UserCheck },
    { id: 'customers', title: 'Customers', subtitle: 'Customer profiles & ordering frequency', icon: Users },
    { id: 'orders', title: 'Orders Monitor', subtitle: 'Live customer token tickets & order statuses', icon: ShoppingBag },
    { id: 'reports', title: 'Reports & Issues', subtitle: 'Customer complaints & vendor infractions', icon: AlertTriangle },
    { id: 'analytics', title: 'Analytics', subtitle: 'Order trends, hourly distribution & revenue', icon: BarChart3 },
    { id: 'audit', title: 'Audit Logs', subtitle: 'Administrative decisions & security events', icon: ScrollText },
    { id: 'settings', title: 'Settings & Schema', subtitle: 'Database configuration & operational controls', icon: Settings },
  ];

  // Construct items based on search query
  const items: CommandItem[] = [];
  const q = query.toLowerCase().trim();

  // 1. Actions (if matching or query is short)
  const actionItems: CommandItem[] = [
    {
      id: 'action-refresh',
      category: 'Actions',
      title: 'Refresh Platform Data',
      subtitle: 'Synchronize shops, KYC submissions, and metrics',
      icon: RefreshCw,
      action: () => {
        onRefreshData();
        onClose();
      },
    },
    {
      id: 'action-export-verifications',
      category: 'Actions',
      title: 'Export KYC Verifications CSV',
      subtitle: 'Download verification applications as CSV',
      icon: Download,
      action: () => {
        onExportVerificationsCsv();
        onClose();
      },
    },
    {
      id: 'action-export-verifications-pdf',
      category: 'Actions',
      title: 'Export KYC Verifications PDF Report',
      subtitle: 'Generate branded PDF dossier with filtering state summary',
      icon: FileDown,
      action: () => {
        if (onExportVerificationsPdf) {
          onExportVerificationsPdf();
        } else {
          onExportVerificationsCsv();
        }
        onClose();
      },
    },
    {
      id: 'action-export-shops',
      category: 'Actions',
      title: 'Export Platform Shops CSV',
      subtitle: 'Download complete merchant directory as CSV',
      icon: Download,
      action: () => {
        onExportShopsCsv();
        onClose();
      },
    },
    {
      id: 'action-export-shops-pdf',
      category: 'Actions',
      title: 'Export Platform Shops PDF Report',
      subtitle: 'Generate official PDF directory report with active filters header',
      icon: FileDown,
      action: () => {
        if (onExportShopsPdf) {
          onExportShopsPdf();
        } else {
          onExportShopsCsv();
        }
        onClose();
      },
    },
    {
      id: 'action-shortcuts',
      category: 'Actions',
      title: 'View Keyboard Shortcuts',
      subtitle: 'Open the cheat sheet of admin shortcuts (?)',
      icon: Keyboard,
      action: () => {
        onClose();
        onOpenShortcuts();
      },
    },
  ];

  // 2. Navigation items matching query
  navTabs.forEach((tab) => {
    if (!q || tab.title.toLowerCase().includes(q) || tab.subtitle.toLowerCase().includes(q)) {
      items.push({
        id: `nav-${tab.id}`,
        category: 'Navigation',
        title: `Go to ${tab.title}`,
        subtitle: tab.subtitle,
        icon: tab.icon,
        action: () => {
          onNavigateTab(tab.id);
          onClose();
        },
      });
    }
  });

  // 3. Shop items matching query
  if (q) {
    const matchedShops = shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.area?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
    matchedShops.slice(0, 6).forEach((s) => {
      items.push({
        id: `shop-${s.id}`,
        category: 'Shops',
        title: s.name,
        subtitle: `${s.city || 'Mumbai'} • ${s.area || s.address || 'Street vendor'} • ${s.phone || 'No phone'}`,
        badge: s.is_active ? 'Active' : 'Inactive',
        badgeColor: s.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700',
        icon: Store,
        action: () => {
          onSelectShop(s);
          onClose();
        },
      });
    });

    // 4. KYC Requests matching query
    const matchedVerifications = verifications.filter((v) => {
      const sName = v.shop?.name || '';
      const oName = v.owner?.full_name || '';
      return (
        sName.toLowerCase().includes(q) ||
        oName.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q)
      );
    });
    matchedVerifications.slice(0, 4).forEach((v) => {
      items.push({
        id: `verif-${v.id}`,
        category: 'KYC Verifications',
        title: `Verification: ${v.shop?.name || 'Unnamed Shop'}`,
        subtitle: `Owner: ${v.owner?.full_name || 'Merchant'} • Submitted: ${v.submitted_at?.slice(0, 10)}`,
        badge: v.status,
        badgeColor:
          v.status === 'Approved'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : v.status === 'Rejected'
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        icon: ShieldCheck,
        action: () => {
          onSelectVerification(v);
          onClose();
        },
      });
    });

    // 5. Orders matching query
    const matchedOrders = orders.filter((o) => {
      return (
        o.id.toLowerCase().includes(q) ||
        o.token_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.shop_name?.toLowerCase().includes(q)
      );
    });
    matchedOrders.slice(0, 3).forEach((o) => {
      items.push({
        id: `order-${o.id}`,
        category: 'Orders',
        title: `Order #${o.token_number || o.id.slice(0, 8)}`,
        subtitle: `${o.shop_name || 'Shop'} • Customer: ${o.customer_name || 'Guest'} • ₹${o.total}`,
        badge: o.order_status,
        badgeColor: o.order_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300',
        icon: ShoppingBag,
        action: () => {
          onNavigateTab('orders');
          onClose();
        },
      });
    });
  }

  // Add actions at bottom or if matching
  actionItems.forEach((act) => {
    if (!q || act.title.toLowerCase().includes(q) || act.subtitle?.toLowerCase().includes(q)) {
      items.push(act);
    }
  });

  // Handle keyboard events inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, shop name, customer, city, or jump to tab..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/80 rounded">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by shop name, city, or quick actions</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate text-slate-200">{item.title}</span>
                        <span className="text-[10px] font-mono uppercase text-slate-500">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-medium border rounded-full ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 rounded border border-slate-700 text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 rounded border border-slate-700 text-slate-300">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 rounded border border-slate-700 text-slate-300">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 rounded border border-slate-700 text-slate-300">Esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">FoodFax Executive Console</span>
        </div>
      </div>
    </div>
  );
};
