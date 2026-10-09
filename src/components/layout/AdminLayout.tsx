import React, { useState } from 'react';
import {
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
  LogOut,
  ChevronRight,
  Menu,
  X,
  FileCheck2,
  RefreshCw,
  Search,
  Keyboard,
} from 'lucide-react';
import type { UserProfile } from '../../types/admin';

export type AdminTab =
  | 'dashboard'
  | 'verification'
  | 'shops'
  | 'owners'
  | 'customers'
  | 'orders'
  | 'reports'
  | 'analytics'
  | 'audit'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  adminProfile: UserProfile;
  onSignOut: () => void;
  pendingKycCount: number;
  openReportsCount: number;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsModal?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  adminProfile,
  onSignOut,
  pendingKycCount,
  openReportsCount,
  onRefreshData,
  isRefreshing,
  lastRefreshedAt,
  onOpenCommandPalette,
  onOpenShortcutsModal,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'verification' as AdminTab,
      label: 'KYC & Verification',
      icon: ShieldCheck,
      badge: pendingKycCount > 0 ? pendingKycCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    { id: 'shops' as AdminTab, label: 'All Shops', icon: Store },
    { id: 'owners' as AdminTab, label: 'Shop Owners', icon: UserCheck },
    { id: 'customers' as AdminTab, label: 'Customers', icon: Users },
    { id: 'orders' as AdminTab, label: 'Orders Monitor', icon: ShoppingBag },
    {
      id: 'reports' as AdminTab,
      label: 'Reports & Issues',
      icon: AlertTriangle,
      badge: openReportsCount > 0 ? openReportsCount : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
    { id: 'audit' as AdminTab, label: 'Audit Logs', icon: ScrollText },
    { id: 'settings' as AdminTab, label: 'System & Schema', icon: Settings },
  ];

  const currentNavItem = navItems.find((item) => item.id === currentTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 select-none">
        {/* Brand Area */}
        <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-tight block">FoodFax Admin</span>
              <span className="text-[10px] text-emerald-400 font-medium block">Executive Console</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono tabular-nums rounded border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin User Footer Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-800">
            <div className="truncate mr-2">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                {adminProfile.full_name || 'Admin User'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate font-mono">
                {adminProfile.email}
              </span>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-100">FoodFax Admin</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="p-1.5 text-slate-400 hover:text-slate-100"
              title="Search (Ctrl+K / ⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="p-1.5 text-slate-300 hover:text-emerald-400 disabled:opacity-50"
              title="Refresh Data (Press R)"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                currentTab === item.id ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== null && item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-200">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800 mt-2">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Contract: Breadcrumb + Admin Info */}
        <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Administration</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-200">{currentNavItem?.label}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Command & Search Palette Trigger */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors shadow-inner"
                title="Search or jump to tab (Ctrl+K / ⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Search / Jump...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {isMac ? '⌘K' : 'Ctrl+K'}
                </kbd>
              </button>
            )}

            {/* Keyboard Shortcuts Cheat Sheet Button */}
            {onOpenShortcutsModal && (
              <button
                type="button"
                onClick={onOpenShortcutsModal}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors"
                title="Keyboard Shortcuts Reference (Press ?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}

            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 group"
                title="Immediately refresh platform verification requests, shops, and metrics (Press R)"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-400 group-hover:rotate-180 transition-transform duration-500 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="font-semibold">Refresh Data</span>
                {lastRefreshedAt && (
                  <span className="text-[10px] text-slate-400 font-mono hidden lg:inline pl-1.5 border-l border-slate-700">
                    {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px]">Database: Live</span>
            </div>
            <div className="hidden md:block text-xs font-medium text-slate-400 font-mono">
              Role: <span className="text-emerald-400 font-semibold uppercase">{adminProfile.role}</span>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
