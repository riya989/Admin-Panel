/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentAdmin, signOutAdmin, supabase } from './lib/supabase';
import {
  fetchDashboardStats,
  fetchVerifications,
  fetchVerificationDetail,
  approveVerification,
  rejectVerification,
  verifyDocument,
  rejectDocument,
  resubmitVerification,
  uploadVerificationDocument,
  fetchShops,
  fetchShopDetail,
  toggleShopStatus,
  toggleUserStatus,
  batchVerificationAction,
  batchShopAction,
  fetchOwners,
  fetchCustomers,
  fetchOrders,
  overrideOrderStatus,
  fetchReports,
  createReport,
  updateReport,
  fetchAuditLogs,
  deleteShop,
  batchDeleteShops,
  deleteCustomer,
  ensureDefaultKycDocuments,
} from './lib/api';
import { AdminLayout, AdminTab } from './components/layout/AdminLayout';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { VerificationListView } from './components/verification/VerificationListView';
import { VerificationDetailModal } from './components/verification/VerificationDetailModal';
import { ShopsListView } from './components/shops/ShopsListView';
import { ShopDetailModal } from './components/shops/ShopDetailModal';
import { OwnersListView } from './components/owners/OwnersListView';
import { CustomersListView } from './components/customers/CustomersListView';
import { OrdersMonitorView } from './components/orders/OrdersMonitorView';
import { ReportsView } from './components/reports/ReportsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { ToastContainer, toast } from './components/common/Toast';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { exportShopsToCSV, exportVerificationsToCSV } from './lib/csvExport';
import { exportShopsToPDF, exportVerificationsToPDF } from './lib/pdfExport';
import type {
  UserProfile,
  DashboardStats,
  ShopVerificationRequest,
  Shop,
  Customer,
  Order,
  PlatformReport,
  AdminAuditLog,
} from './types/admin';

export default function App() {
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // Core Data States
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [verifications, setVerifications] = useState<ShopVerificationRequest[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Loading States
  const [dataLoading, setDataLoading] = useState(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Command Palette & Keyboard Shortcuts Modal States
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Filters
  const [kycStatusFilter, setKycStatusFilter] = useState('all');
  const [kycSearch, setKycSearch] = useState('');

  // Selected Inspect Entities
  const [selectedVerification, setSelectedVerification] = useState<ShopVerificationRequest | null>(null);
  const [selectedShopData, setSelectedShopData] = useState<{
    shop: Shop;
    owner: UserProfile | null;
    menuItems: any[];
    orders: any[];
    documents: any[];
    auditLogs?: AdminAuditLog[];
  } | null>(null);

  // Manual & Real-time Refresh Tracking
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(new Date());

  // 1. Initial Authentication Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getCurrentAdmin();
        if (res && res.profile) {
          setAdminProfile(res.profile);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setAdminProfile(null);
      } else {
        const res = await getCurrentAdmin();
        setAdminProfile(res?.profile || null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch All Platform Data
  const loadPlatformData = useCallback(async (isSilent = false) => {
    if (!adminProfile) return;
    if (!isSilent) setDataLoading(true);

    console.groupCollapsed(`[loadPlatformData] Fetching platform data (${new Date().toLocaleTimeString()})`);
    console.log('[loadPlatformData] Trace parameters passed to fetchVerifications:', {
      kycStatusFilter,
      kycSearch,
      adminUser: adminProfile.email,
    });

    try {
      const [
        statsData,
        verifData,
        shopsData,
        ownersData,
        custData,
        ordersData,
        reportsData,
        auditData,
      ] = await Promise.all([
        fetchDashboardStats().catch((err) => {
          console.warn('[loadPlatformData] fetchDashboardStats notice:', err);
          return null;
        }),
        fetchVerifications(kycStatusFilter, kycSearch).catch((err) => {
          console.warn('[loadPlatformData] fetchVerifications notice:', err);
          return [];
        }),
        fetchShops({}).catch((err) => {
          console.warn('[loadPlatformData] fetchShops notice:', err);
          return [];
        }),
        fetchOwners().catch(() => []),
        fetchCustomers().catch(() => []),
        fetchOrders({}).catch(() => []),
        fetchReports().catch(() => []),
        fetchAuditLogs().catch(() => []),
      ]);

      // =========================================================================
      // [loadPlatformData] INSPECTION OF RAW ARRAY RETURNED BY fetchVerifications
      // =========================================================================
      console.log('=== [loadPlatformData] RAW ARRAY RETURNED BY fetchVerifications ===');
      console.log('Is Array?', Array.isArray(verifData), 'Length:', Array.isArray(verifData) ? verifData.length : typeof verifData);
      console.log('Full contents of raw verifications array:', verifData);

      if (Array.isArray(verifData)) {
        if (verifData.length === 0) {
          console.warn('⚠️ [loadPlatformData] The verifications array is EMPTY ([]). No records were returned from the server.');
        } else {
          console.log(`[loadPlatformData] Inspecting ${verifData.length} verification record(s) for expected status field:`);
          verifData.forEach((record: any, idx: number) => {
            const hasStatus =
              'status' in record &&
              record.status !== null &&
              record.status !== undefined &&
              typeof record.status === 'string' &&
              record.status.trim() !== '';

            console.log(`Record [${idx}]:`, {
              id: record.id,
              shop_id: record.shop_id,
              shop_name: record.shop?.name || record.shop_name,
              status: record.status,
              hasExpectedStatusField: hasStatus,
              fullRecord: record,
            });

            if (!hasStatus) {
              console.warn(
                `⚠️ [loadPlatformData] Record at index [${idx}] (id: ${record.id}) is MISSING or has an INVALID/NULL status field! Status value:`,
                record.status
              );
            }
          });

          const missingStatusRecords = verifData.filter(
            (r: any) => !r.status || typeof r.status !== 'string' || r.status.trim() === ''
          );
          if (missingStatusRecords.length > 0) {
            console.warn(
              `⚠️ [loadPlatformData] Detected ${missingStatusRecords.length} record(s) with MISSING or NULL status field that may cause filtering issues!`,
              missingStatusRecords
            );
          } else {
            console.log('✅ [loadPlatformData] All records have a valid expected status field.');
          }
        }
      } else {
        console.error('❌ [loadPlatformData] fetchVerifications did not return an array! Received:', verifData);
      }
      console.log('========================================================================');
      console.groupEnd();

      const validShopIds = new Set((shopsData || []).map((s: any) => s.id));
      const cleanVerifData = (Array.isArray(verifData) ? verifData : [])
        .filter((v: any) => validShopIds.has(v.shop_id))
        .map((v: any) => {
          if (!v.documents || v.documents.length === 0) {
            const sh = (shopsData || []).find((s: any) => s.id === v.shop_id) || v.shop;
            return {
              ...v,
              documents: ensureDefaultKycDocuments(sh || { id: v.shop_id }, v.id),
            };
          }
          return v;
        });

      if (statsData) {
        if (Array.isArray(statsData.recentKycRequests)) {
          statsData.recentKycRequests = statsData.recentKycRequests.filter((v: any) =>
            validShopIds.has(v.shop_id)
          );
        }
        if (Array.isArray(statsData.recentShops)) {
          statsData.recentShops = statsData.recentShops.filter((s: any) =>
            validShopIds.has(s.id)
          );
        }
        statsData.totalShops = (shopsData || []).length;
        statsData.activeShops = (shopsData || []).filter((s: any) => s.is_active).length;
        statsData.pendingKyc = cleanVerifData.filter(
          (v: any) => v.status === 'Submitted' || v.status === 'Under Review' || !v.status
        ).length;
        setDashboardStats(statsData);
      }
      setVerifications(cleanVerifData);
      setShops(shopsData);
      setOwners(ownersData);
      setCustomers(custData);
      setOrders(ordersData);
      setReports(reportsData);
      setAuditLogs(auditData);
    } catch (err: any) {
      console.error('[loadPlatformData] Failed to load platform data:', err);
      toast.error('Data Sync Error', err?.message || 'Failed to sync platform records');
      console.groupEnd();
    } finally {
      setDataLoading(false);
      setLastRefreshedAt(new Date());
    }
  }, [adminProfile, kycStatusFilter, kycSearch]);

  // Manual Refresh Handler
  const handleManualRefresh = useCallback(async () => {
    try {
      await loadPlatformData();
      toast.success('Data Refreshed', 'Latest shop submissions and verification queue loaded.');
    } catch (err: any) {
      toast.error('Refresh Failed', err?.message || 'Could not complete platform sync.');
    }
  }, [loadPlatformData]);

  useEffect(() => {
    if (adminProfile) {
      loadPlatformData();
    }
  }, [adminProfile, loadPlatformData]);

  // Real-time Supabase subscription for shops table changes
  useEffect(() => {
    if (!adminProfile) return;

    // Listen for real-time inserts, updates, and deletes on shops
    const channel = supabase
      .channel('admin-realtime-shops-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shops' },
        (payload) => {
          console.log('[Supabase Realtime] shops change detected:', payload);
          loadPlatformData(true);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[Supabase Realtime] Subscription issue:', err);
        } else {
          console.log('[Supabase Realtime] Channel active:', status);
        }
      });

    // Low-frequency safety poll every 20s to guarantee fresh metrics even during network drops
    const safetyPoll = setInterval(() => {
      loadPlatformData(true);
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(safetyPoll);
    };
  }, [adminProfile, loadPlatformData]);

  // CSV & PDF Export Handlers
  const handleExportShopsCsv = useCallback(() => {
    if (shops.length === 0) {
      toast.error('No Shops Available', 'There are no shops in the directory to export.');
      return;
    }
    const count = exportShopsToCSV(shops);
    toast.success('Shops Exported', `Downloaded CSV with ${count} platform shops.`);
  }, [shops]);

  const handleExportShopsPdf = useCallback(() => {
    if (shops.length === 0) {
      toast.error('No Shops Available', 'There are no shops in the directory to export.');
      return;
    }
    const count = exportShopsToPDF({
      shops,
      totalInView: shops.length,
      filters: {},
      adminEmail: adminProfile?.email || undefined,
    });
    toast.success('Shops PDF Exported', `Generated PDF directory report with active filters summary (${count} shops).`);
  }, [shops, adminProfile]);

  const handleExportVerificationsCsv = useCallback(() => {
    if (verifications.length === 0) {
      toast.error('No Verifications Available', 'There are no verification requests to export.');
      return;
    }
    const count = exportVerificationsToCSV(verifications);
    toast.success('KYC Requests Exported', `Downloaded CSV with ${count} verification records.`);
  }, [verifications]);

  const handleExportVerificationsPdf = useCallback(() => {
    if (verifications.length === 0) {
      toast.error('No Verifications Available', 'There are no verification requests to export.');
      return;
    }
    const count = exportVerificationsToPDF({
      requests: verifications,
      totalInView: verifications.length,
      filters: {},
      adminEmail: adminProfile?.email || undefined,
    });
    toast.success('KYC PDF Exported', `Generated PDF verification dossier with active filters summary (${count} records).`);
  }, [verifications, adminProfile]);

  // Global Keyboard Shortcuts (Ctrl+K, Esc, ?, R, 1-9)
  useEffect(() => {
    if (!adminProfile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K: Open Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 2. Escape: Close topmost active modal or panel
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          e.preventDefault();
          setCommandPaletteOpen(false);
          return;
        }
        if (shortcutsModalOpen) {
          e.preventDefault();
          setShortcutsModalOpen(false);
          return;
        }
        if (selectedVerification) {
          e.preventDefault();
          setSelectedVerification(null);
          return;
        }
        if (selectedShopData) {
          e.preventDefault();
          setSelectedShopData(null);
          return;
        }
        return;
      }

      // Skip single-character hotkeys when user is typing in an input or textarea
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // 3. ? or Shift+/: Open Keyboard Shortcuts Reference
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 4. R: Refresh platform data
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleManualRefresh();
        return;
      }

      // 5. 1-9: Direct tab switching
      const tabMap: Record<string, AdminTab> = {
        '1': 'dashboard',
        '2': 'verification',
        '3': 'shops',
        '4': 'owners',
        '5': 'customers',
        '6': 'orders',
        '7': 'reports',
        '8': 'analytics',
        '9': 'audit',
      };
      if (tabMap[e.key]) {
        e.preventDefault();
        setCurrentTab(tabMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    adminProfile,
    commandPaletteOpen,
    shortcutsModalOpen,
    selectedVerification,
    selectedShopData,
    handleManualRefresh,
  ]);

  // 3. Open Verification Detail
  const handleOpenVerification = async (req: ShopVerificationRequest) => {
    try {
      const fullDetail = await fetchVerificationDetail(req.id);
      setSelectedVerification(fullDetail);
    } catch {
      setSelectedVerification(req);
    }
  };

  // 4. Open Shop Detail
  const handleOpenShop = async (shop: Shop) => {
    try {
      const fullShop = await fetchShopDetail(shop.id);
      setSelectedShopData(fullShop);
    } catch (err) {
      console.error('Failed to fetch shop details:', err);
    }
  };

  // 5. Verification Actions
  const handleApproveVerification = async (id: string, notes?: string) => {
    try {
      await approveVerification(id, notes);
      toast.success('Shop Verification Approved', 'Merchant shop activated and approval notification sent.');
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Approval Failed', err?.message || 'Could not approve verification request');
    }
  };

  const handleRejectVerification = async (
    id: string,
    data: { rejectionReason: string; customFeedback?: string; rejectedDocIds?: string[] }
  ) => {
    try {
      await rejectVerification(id, data);
      toast.warning('Shop Verification Rejected', 'Rejection reason and feedback delivered to shop owner.');
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Rejection Failed', err?.message || 'Could not reject verification request');
    }
  };

  const handleVerifyDocument = async (docId: string) => {
    try {
      await verifyDocument(docId);
      toast.success('Document Verified', 'Compliance document marked as verified.');
      if (selectedVerification) {
        const updated = await fetchVerificationDetail(selectedVerification.id);
        setSelectedVerification(updated);
      }
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Document Verification Failed', err?.message || 'Could not update document state');
    }
  };

  const handleRejectDocument = async (docId: string, reason: string) => {
    try {
      await rejectDocument(docId, reason);
      toast.warning('Document Rejected', `Deficiency flagged: ${reason}`);
      if (selectedVerification) {
        const updated = await fetchVerificationDetail(selectedVerification.id);
        setSelectedVerification(updated);
      }
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Document Rejection Failed', err?.message || 'Could not flag document');
    }
  };

  const handleResubmitVerification = async (id: string) => {
    try {
      await resubmitVerification(id);
      toast.info('Verification Resubmitted', 'Simulated merchant re-upload received.');
      if (selectedVerification) {
        const updated = await fetchVerificationDetail(selectedVerification.id);
        setSelectedVerification(updated);
      }
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Resubmission Failed', err?.message || 'Could not trigger resubmission');
    }
  };

  const handleUploadDocument = async (
    requestId: string,
    data: { documentType: string; documentName: string; fileBase64?: string; mimeType?: string }
  ) => {
    try {
      await uploadVerificationDocument(requestId, data);
      toast.success('Document Attached', `${data.documentName} securely saved to KYC vault.`);
      if (selectedVerification) {
        const updated = await fetchVerificationDetail(selectedVerification.id);
        setSelectedVerification(updated);
      }
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Document Upload Failed', err?.message || 'Could not upload document');
    }
  };

  // 5b. Batch KYC Verification Action
  const handleBatchVerificationAction = async (
    ids: string[],
    action: 'approve' | 'reject',
    data?: { notes?: string; rejectionReason?: string }
  ) => {
    try {
      await batchVerificationAction(ids, action, data);
      toast.success(
        action === 'approve' ? 'Batch Approved' : 'Batch Rejected',
        `Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${ids.length} verification requests.`
      );
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Batch Action Failed', err?.message || 'Could not complete batch action');
    }
  };

  // 6. Shop & Account Governance Actions
  const handleToggleShopStatus = async (
    shopId: string,
    action: 'activate' | 'deactivate' | 'suspend' | 'unsuspend',
    reason?: string,
    options?: { suspendOwnerAccount?: boolean; unsuspendOwnerAccount?: boolean }
  ) => {
    try {
      await toggleShopStatus(shopId, action, reason, options);
      const actionName =
        action === 'suspend'
          ? 'Suspended'
          : action === 'unsuspend'
          ? 'Reactivated / Unsuspended'
          : action === 'activate'
          ? 'Activated'
          : 'Deactivated';
      toast.success(
        `Shop ${actionName}`,
        `Shop status updated successfully.${options?.suspendOwnerAccount ? ' Merchant owner account suspended.' : ''}${options?.unsuspendOwnerAccount ? ' Merchant owner account reactivated.' : ''}`
      );
      const updated = await fetchShopDetail(shopId);
      setSelectedShopData(updated);
      await loadPlatformData();
    } catch (err: any) {
      toast.error(`Status Change Failed`, err?.message || 'Could not update shop status');
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    action: 'suspend' | 'unsuspend',
    reason: string,
    cascadeShops = false
  ) => {
    try {
      await toggleUserStatus(userId, action, reason, cascadeShops);
      const actionTitle =
        action === 'suspend'
          ? 'Account Suspended'
          : 'Account Reactivated / Unsuspended';
      toast.success(
        actionTitle,
        `User account successfully ${action === 'suspend' ? 'suspended' : 'unsuspended'}.${cascadeShops ? ' Associated shops were updated.' : ''}`
      );
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Account Action Failed', err?.message || 'Could not update user account status');
    }
  };

  const handleBatchShopsAction = async (
    ids: string[],
    action: 'approve' | 'reject' | 'activate' | 'suspend' | 'unsuspend' | 'edit_status' | 'delete',
    data?: { notes?: string; rejectionReason?: string; status?: string; isOpen?: boolean }
  ) => {
    try {
      if (action === 'delete') {
        await handleBatchDeleteShops(ids, data?.notes || data?.rejectionReason);
        return;
      }
      await batchShopAction(ids, action, data);
      const actionTitle =
        action === 'edit_status'
          ? `Status Updated to "${data?.status || 'Custom'}"`
          : action === 'approve' || action === 'activate' || action === 'unsuspend'
          ? 'Batch Approved / Activated'
          : 'Batch Rejected / Suspended';

      toast.success(
        actionTitle,
        `Successfully updated ${ids.length} shop record(s) on platform.`
      );
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Batch Action Failed', err?.message || 'Could not complete batch action on shops');
    }
  };

  const handleDeleteShop = async (shopId: string, reason?: string) => {
    try {
      setShops((prev) => prev.filter((s) => s.id !== shopId));
      setVerifications((prev) => prev.filter((v) => v.shop_id !== shopId));
      if (selectedShopData?.shop.id === shopId) {
        setSelectedShopData(null);
      }
      await deleteShop(shopId, reason);
      toast.success(
        'Shop Deleted Permanently',
        'Shop and all its KYC compliance documents and listings were purged from the database.'
      );
      await loadPlatformData(true);
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not delete shop');
      await loadPlatformData();
    }
  };

  const handleBatchDeleteShops = async (ids: string[], reason?: string) => {
    try {
      const idSet = new Set(ids);
      setShops((prev) => prev.filter((s) => !idSet.has(s.id)));
      setVerifications((prev) => prev.filter((v) => !idSet.has(v.shop_id)));
      if (selectedShopData && idSet.has(selectedShopData.shop.id)) {
        setSelectedShopData(null);
      }
      await batchDeleteShops(ids, reason);
      toast.success(
        'Batch Deletion Complete',
        `Permanently deleted ${ids.length} shops and purged all associated KYC documents.`
      );
      await loadPlatformData(true);
    } catch (err: any) {
      toast.error('Batch Delete Failed', err?.message || 'Could not complete batch shop deletion');
      await loadPlatformData();
    }
  };

  const handleDeleteCustomer = async (customerId: string, reason?: string) => {
    try {
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      await deleteCustomer(customerId, reason);
      toast.success(
        'Customer Account Deleted',
        'Customer record was permanently removed from the database.'
      );
      await loadPlatformData(true);
    } catch (err: any) {
      toast.error('Customer Deletion Failed', err?.message || 'Could not delete customer account');
      await loadPlatformData();
    }
  };

  // 7. Order Override
  const handleOverrideOrder = async (orderId: string, newStatus: string, reason: string) => {
    try {
      await overrideOrderStatus(orderId, newStatus, reason);
      toast.success('Order Status Overridden', `Order #${orderId.slice(-6)} set to ${newStatus}.`);
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Order Override Failed', err?.message || 'Could not override order status');
    }
  };

  // 8. Report Actions
  const handleUpdateReport = async (
    reportId: string,
    update: { status?: string; adminNotes?: string }
  ) => {
    try {
      await updateReport(reportId, update);
      toast.success('Report Updated', 'Issue status and resolution notes updated.');
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Report Update Failed', err?.message || 'Could not update report');
    }
  };

  const handleCreateReport = async (data: any) => {
    try {
      await createReport(data);
      toast.success('Report Logged', 'Incident report registered in system.');
      await loadPlatformData();
    } catch (err: any) {
      toast.error('Report Creation Failed', err?.message || 'Could not create report');
    }
  };

  // 9. Sign Out
  const handleSignOut = async () => {
    await signOutAdmin();
    setAdminProfile(null);
  };

  // Rendering Loading Gate
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <span>Authorizing FoodFax Platform Session...</span>
      </div>
    );
  }

  // Not Authenticated -> Login Page
  if (!adminProfile) {
    return (
      <AdminLoginPage
        onSuccess={(profile) => {
          setAdminProfile(profile);
        }}
      />
    );
  }

  const pendingKycCount =
    dashboardStats?.pendingKyc ??
    verifications.filter((v) => v.status === 'Submitted' || v.status === 'Under Review').length;

  const openReportsCount =
    dashboardStats?.pendingReports ??
    reports.filter((r) => r.status === 'Open' || r.status === 'Under Review').length;

  return (
    <>
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <AdminLayout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        adminProfile={adminProfile}
        onSignOut={handleSignOut}
        pendingKycCount={pendingKycCount}
        openReportsCount={openReportsCount}
        onRefreshData={handleManualRefresh}
        isRefreshing={dataLoading}
        lastRefreshedAt={lastRefreshedAt}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenShortcutsModal={() => setShortcutsModalOpen(true)}
      >
      {/* Tab Routing */}
      {currentTab === 'dashboard' && dashboardStats && (
        <DashboardView
          stats={dashboardStats}
          orders={orders}
          verifications={verifications}
          shops={shops}
          onNavigateTab={setCurrentTab}
          onSelectVerification={handleOpenVerification}
        />
      )}

      {currentTab === 'verification' && (
        <VerificationListView
          requests={verifications}
          loading={dataLoading}
          onRefresh={loadPlatformData}
          onSelectRequest={handleOpenVerification}
          statusFilter={kycStatusFilter}
          onStatusFilterChange={setKycStatusFilter}
          searchTerm={kycSearch}
          onSearchTermChange={setKycSearch}
          onBatchAction={handleBatchVerificationAction}
        />
      )}

      {currentTab === 'shops' && (
        <ShopsListView
          shops={shops}
          loading={dataLoading}
          onRefresh={loadPlatformData}
          onSelectShop={handleOpenShop}
          onBatchAction={handleBatchShopsAction}
          onToggleStatus={handleToggleShopStatus}
          onDeleteShop={handleDeleteShop}
        />
      )}

      {currentTab === 'owners' && (
        <OwnersListView
          owners={owners}
          loading={dataLoading}
          onRefresh={loadPlatformData}
          onToggleUserStatus={handleToggleUserStatus}
          onSelectShopId={async (shopId) => {
            const sh = shops.find((s) => s.id === shopId);
            if (sh) handleOpenShop(sh);
          }}
        />
      )}

      {currentTab === 'customers' && (
        <CustomersListView
          customers={customers}
          loading={dataLoading}
          onRefresh={loadPlatformData}
          onToggleUserStatus={handleToggleUserStatus}
          onDeleteCustomer={handleDeleteCustomer}
        />
      )}

      {currentTab === 'orders' && (
        <OrdersMonitorView
          orders={orders}
          loading={dataLoading}
          onRefresh={loadPlatformData}
          onOverrideStatus={handleOverrideOrder}
        />
      )}

      {currentTab === 'reports' && (
        <ReportsView
          reports={reports}
          loading={dataLoading}
          onRefresh={loadPlatformData}
          onUpdateReport={handleUpdateReport}
          onCreateReport={handleCreateReport}
        />
      )}

      {currentTab === 'analytics' && dashboardStats && (
        <AnalyticsView stats={dashboardStats} />
      )}

      {currentTab === 'audit' && (
        <AuditLogsView
          logs={auditLogs}
          loading={dataLoading}
          onRefresh={loadPlatformData}
        />
      )}

      {currentTab === 'settings' && <SettingsView />}

      {/* Verification Inspection & Decision Modal */}
      {selectedVerification && (
        <VerificationDetailModal
          request={selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onApprove={handleApproveVerification}
          onReject={handleRejectVerification}
          onVerifyDocument={handleVerifyDocument}
          onRejectDocument={handleRejectDocument}
          onResubmit={handleResubmitVerification}
          onUploadDocument={handleUploadDocument}
        />
      )}

      {/* Shop Inspection Modal */}
      {selectedShopData && (
        <ShopDetailModal
          shop={selectedShopData.shop}
          owner={selectedShopData.owner}
          menuItems={selectedShopData.menuItems}
          orders={selectedShopData.orders}
          documents={selectedShopData.documents}
          auditLogs={selectedShopData.auditLogs}
          onClose={() => setSelectedShopData(null)}
          onToggleStatus={handleToggleShopStatus}
          onDeleteShop={handleDeleteShop}
        />
      )}

      {/* Global Command & Quick Search Palette (Ctrl+K / ⌘K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigateTab={setCurrentTab}
        onSelectShop={handleOpenShop}
        onSelectVerification={handleOpenVerification}
        onRefreshData={handleManualRefresh}
        onExportShopsCsv={handleExportShopsCsv}
        onExportVerificationsCsv={handleExportVerificationsCsv}
        onExportShopsPdf={handleExportShopsPdf}
        onExportVerificationsPdf={handleExportVerificationsPdf}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        shops={shops}
        verifications={verifications}
        orders={orders}
      />

      {/* Global Keyboard Shortcuts Cheat Sheet Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </AdminLayout>
    <ToastContainer />
    </>
  );
}
