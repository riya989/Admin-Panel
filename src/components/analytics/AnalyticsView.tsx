import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Store, Users, MapPin } from 'lucide-react';
import type { DashboardStats } from '../../types/admin';

interface AnalyticsViewProps {
  stats: DashboardStats;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span>Platform Business & Operations Analytics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical growth metrics, financial velocity, and compliance telemetry.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Gross Marketplace Value</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-2">
            ₹{stats.totalSales.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">From {stats.totalOrders} total orders</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Average Order Value (AOV)</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-2">
            ₹{stats.totalOrders ? Math.round(stats.totalSales / stats.totalOrders) : 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Per customer transaction</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">Merchant Adoption Rate</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-2">
            {stats.totalShops ? Math.round((stats.activeShops / stats.totalShops) * 100) : 0}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{stats.activeShops} active out of {stats.totalShops}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-400">KYC Verification Funnel</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-2">
            {stats.pendingKyc} Pending
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{stats.approvedShops} approved · {stats.rejectedShops} rejected</span>
        </div>
      </div>

      {/* Regional & Format Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-sm text-slate-200 mb-1 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Format Segmentation</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown between mobile carts and dine-in locations</p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Mobile Food Stalls & Thelas</span>
                <span className="font-mono text-amber-400 font-bold">{stats.mobileStalls} outlets</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${stats.totalShops ? (stats.mobileStalls / stats.totalShops) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Permanent Cafes & Restaurants</span>
                <span className="font-mono text-sky-400 font-bold">{stats.permanentRestaurants} outlets</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${stats.totalShops ? (stats.permanentRestaurants / stats.totalShops) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-sm text-slate-200 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Geographic Concentration</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Primary customer and food stall nodes in Mumbai</p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Naigaon East / Vasai-Virar</span>
                <span className="text-[11px] text-slate-500">Fast Food & Street Chaat Cluster</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">Primary Hub</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Mumbai Metropolitan Area</span>
                <span className="text-[11px] text-slate-500">Maharashtra Region</span>
              </div>
              <span className="font-mono text-slate-400">Target Expansion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
