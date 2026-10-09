-- ====================================================================
-- FoodFax Admin & Shop KYC Verification Schema Migration
-- Designed for Supabase PostgreSQL
-- Idempotent, safe, preserves existing tables and data
-- ====================================================================

-- 1. SHOP VERIFICATION REQUESTS
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

-- 2. SHOP VERIFICATION DOCUMENTS
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

-- 3. ADMIN AUDIT LOGS (Append-only)
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

-- 4. REPORTS & ISSUES
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT,
  reporter_name TEXT,
  reporter_role TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('shop', 'customer', 'order', 'platform', 'kyc')),
  target_id TEXT,
  target_name TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'Shop complaint',
    'Customer complaint',
    'Payment issue',
    'Order issue',
    'KYC issue',
    'Fraud/suspicious activity',
    'Technical issue',
    'Other'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Under Review', 'Resolved', 'Rejected')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes for high performance admin queries
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.shop_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_shop ON public.shop_verification_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_owner ON public.shop_verification_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_request ON public.shop_verification_documents(verification_request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 6. Row Level Security (RLS) Enablement
ALTER TABLE public.shop_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 7. Admin RLS Policies
-- Verification Requests
DROP POLICY IF EXISTS "Admins full access on verification requests" ON public.shop_verification_requests;
CREATE POLICY "Admins full access on verification requests"
  ON public.shop_verification_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Owners access own verification requests" ON public.shop_verification_requests;
CREATE POLICY "Owners access own verification requests"
  ON public.shop_verification_requests
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid()::text);

-- Verification Documents
DROP POLICY IF EXISTS "Admins full access on verification documents" ON public.shop_verification_documents;
CREATE POLICY "Admins full access on verification documents"
  ON public.shop_verification_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

-- Audit Logs (Append-only for admins)
DROP POLICY IF EXISTS "Admins view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins create audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins create audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

-- Reports
DROP POLICY IF EXISTS "Admins full access on reports" ON public.reports;
CREATE POLICY "Admins full access on reports"
  ON public.reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );
