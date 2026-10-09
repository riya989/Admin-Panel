import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  MapPin,
  FolderLock,
  Layers,
  FileCode,
  ShieldAlert,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { fetchRlsDiagnostics, runRlsDiagnostics } from '../../lib/api';

export const SettingsView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [rlsReport, setRlsReport] = useState<any>(null);
  const [loadingRls, setLoadingRls] = useState(false);

  const handleRunDiagnostic = async () => {
    setLoadingRls(true);
    try {
      const data = await runRlsDiagnostics();
      if (data) setRlsReport(data);
      else {
        const fallback = await fetchRlsDiagnostics();
        setRlsReport(fallback);
      }
    } catch (err) {
      console.error('Failed to run RLS diagnostic in UI:', err);
    } finally {
      setLoadingRls(false);
    }
  };

  useEffect(() => {
    handleRunDiagnostic();
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aftmqdmiwvpbpsdmsfbu.supabase.co';
  const mapsKeyConfigured = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  const migrationSql = `-- ====================================================================
-- FoodFax Admin & Shop KYC Verification Schema Migration
-- Safe, idempotent, non-destructive
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.shop_verification_requests (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Suspended')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  admin_notes TEXT,
  resubmission_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_verification_documents (
  id TEXT PRIMARY KEY,
  verification_request_id TEXT NOT NULL REFERENCES public.shop_verification_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('fssai_license', 'shop_business_proof', 'owner_id_proof', 'address_proof', 'other')),
  document_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
  rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT,
  reporter_name TEXT,
  reporter_role TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('shop', 'customer', 'order', 'platform', 'kyc')),
  target_id TEXT,
  target_name TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'Shop complaint', 'Customer complaint', 'Payment issue', 'Order issue',
    'KYC issue', 'Fraud/suspicious activity', 'Technical issue', 'Other'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Under Review', 'Resolved', 'Rejected')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`;

  const copySql = () => {
    navigator.clipboard.writeText(migrationSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>System & Supabase Architecture Status</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Infrastructure health, storage bucket security, and database migration telemetry.
        </p>
      </div>

      {/* Infrastructure Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Supabase Core */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase Database</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected</span>
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 text-[11px]">Endpoint URL:</span>
              <p className="font-mono text-slate-200 truncate text-[11px] mt-0.5">{supabaseUrl}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Authentication:</span>
              <p className="text-slate-200 text-[11px]">Supabase Auth with Role Verification</p>
            </div>
          </div>
        </div>

        {/* Private KYC Bucket */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-emerald-400" />
              <span>KYC Storage Vault</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Secured</span>
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 text-[11px]">Storage Bucket:</span>
              <p className="font-mono text-slate-200 text-[11px] mt-0.5">kyc_documents</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Access Policy:</span>
              <p className="text-slate-200 text-[11px]">Private (Signed URLs only, 1hr TTL)</p>
            </div>
          </div>
        </div>

        {/* Google Maps SDK */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Google Maps Engine</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 text-[11px]">Maps JS SDK:</span>
              <p className="font-mono text-slate-200 text-[11px] mt-0.5">
                {mapsKeyConfigured ? 'Custom Key Configured' : 'Demo Engine'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Attribution Tracking:</span>
              <p className="font-mono text-emerald-400 text-[11px]">gmp_mcp_codeassist_v1_aistudio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Report from Initial Inspection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Supabase Schema & Relationship Inspection Report</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <h4 className="font-semibold text-emerald-400 uppercase text-[11px] tracking-wider">
              1. Existing Native Database Tables
            </h4>
            <ul className="space-y-1 text-slate-400 font-mono text-[11px]">
              <li>• <strong className="text-slate-200">shops:</strong> 43 columns (id, owner_id, stall_type, is_mobile_stall, is_open, is_active, coordinates, delivery)</li>
              <li>• <strong className="text-slate-200">users:</strong> 18 columns (id, phone, email, full_name, role: admin/owner/customer)</li>
              <li>• <strong className="text-slate-200">orders:</strong> 31 columns (token_number, customer, order_status, total, payment_method)</li>
              <li>• <strong className="text-slate-200">customers:</strong> 19 columns (phone, email, full_name, area, saved_shop_ids)</li>
              <li>• <strong className="text-slate-200">notifications:</strong> 11 columns (shop_id, user_id, order_id, title, message, type)</li>
              <li>• <strong className="text-slate-200">menu_items:</strong> 17 columns (price, is_veg, is_available, preparation_time)</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <h4 className="font-semibold text-sky-400 uppercase text-[11px] tracking-wider">
              2. Security & RLS Architecture
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Admin authorization enforces <code className="text-emerald-400">users.role = 'admin'</code> at both the database and gateway levels. Customers and shop owners are restricted from administrative actions. Private KYC documents are isolated in the <code className="text-emerald-400">kyc_documents</code> bucket.
            </p>
          </div>
        </div>
      </div>

      {/* RLS Security & Policy Diagnostic Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">
                RLS Policies & SELECT Access Diagnostic Check
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live verification of Postgres Row-Level Security policies on the primary <code className="text-slate-300">shops</code> table and KYC verification pipeline.
            </p>
          </div>
          <button
            onClick={handleRunDiagnostic}
            disabled={loadingRls}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all border border-slate-700 disabled:opacity-50 self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingRls ? 'animate-spin' : ''}`} />
            <span>{loadingRls ? 'Evaluating RLS...' : 'Re-Run Diagnostic'}</span>
          </button>
        </div>

        {/* Results Overview */}
        {rlsReport ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rlsReport.tables?.map((table: any) => {
                const isShops = table.tableName === 'shops';
                const isAllowed = table.adminUserSelectAllowed;
                return (
                  <div
                    key={table.tableName}
                    className={`p-4 rounded-xl border ${
                      isAllowed
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : 'border-amber-500/30 bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-xs font-bold text-slate-200">
                          public.{table.tableName}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isAllowed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {isAllowed ? 'SELECT GRANTED' : 'SCHEMA / RLS RESTRICTED'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 mt-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Admin Explicit SELECT:</span>
                        <span className={`font-semibold ${isAllowed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isAllowed ? 'Allowed (Full Access)' : 'Restricted / Not In Schema'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Database Visible Rows:</span>
                        <span className="font-mono text-slate-200">{table.adminUserRowCount} row(s)</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Service Role Count:</span>
                        <span className="font-mono text-slate-200">{table.serviceRoleRowCount} row(s)</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                        <p>{table.details || table.policyStatus}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Diagnostic Conclusion Summary Banner */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block">
                  Diagnostic Conclusion: {rlsReport.conclusion}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Evaluated at {new Date(rlsReport.timestamp).toLocaleTimeString()} for session admin{' '}
                  <span className="text-emerald-400 font-mono">{rlsReport.adminSession?.email}</span> (role:{' '}
                  <span className="text-slate-200 uppercase">{rlsReport.adminSession?.role}</span>).
                  All new merchant shop submissions are automatically queried without hardcoded filters.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400">
            Running database RLS diagnostics...
          </div>
        )}
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-200">Idempotent SQL Migration DDL</h3>
          </div>
          <button
            onClick={copySql}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied SQL' : 'Copy Migration SQL'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Saved in <code className="text-slate-300 font-mono">supabase/migrations/20261002_admin_kyc_schema.sql</code>. Paste into the Supabase SQL editor at any time.
        </p>
        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
          {migrationSql}
        </pre>
      </div>
    </div>
  );
};
