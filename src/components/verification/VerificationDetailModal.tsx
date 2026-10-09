import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Truck,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  FileText,
  ShieldCheck,
  Eye,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { GoogleMapPreview } from '../common/GoogleMapPreview';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { ensureDefaultKycDocuments, fetchShopKycDocuments, getDocumentTypeLabel } from '../../lib/api';
import type { ShopVerificationRequest, ShopVerificationDocument } from '../../types/admin';

interface VerificationDetailModalProps {
  request: ShopVerificationRequest | null;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (
    id: string,
    data: { rejectionReason: string; customFeedback?: string; rejectedDocIds?: string[] }
  ) => Promise<void>;
  onVerifyDocument: (docId: string) => Promise<void>;
  onRejectDocument: (docId: string, reason: string) => Promise<void>;
  onResubmit: (id: string) => Promise<void>;
  onUploadDocument?: (
    requestId: string,
    data: { documentType: string; documentName: string; fileBase64?: string; mimeType?: string }
  ) => Promise<void>;
}

export const VerificationDetailModal: React.FC<VerificationDetailModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject,
  onVerifyDocument,
  onRejectDocument,
  onResubmit,
  onUploadDocument,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<ShopVerificationDocument | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Invalid documents');
  const [customFeedback, setCustomFeedback] = useState('');
  const [selectedRejectDocs, setSelectedRejectDocs] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Esc key listener for modal and nested dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (selectedDoc) {
          setSelectedDoc(null);
        } else if (showApproveConfirm) {
          setShowApproveConfirm(false);
        } else if (showRejectModal) {
          setShowRejectModal(false);
        } else if (showUploadModal) {
          setShowUploadModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDoc, showApproveConfirm, showRejectModal, showUploadModal, onClose]);

  // Document upload state
  const [newDocType, setNewDocType] = useState('fssai_license');
  const [newDocName, setNewDocName] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>('application/pdf');

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUploadDocument || !newDocName.trim() || !request) return;
    setLoadingAction(true);
    try {
      await onUploadDocument(request.id, {
        documentType: newDocType,
        documentName: newDocName.trim(),
        fileBase64: fileBase64 || undefined,
        mimeType: fileMime,
      });
      setShowUploadModal(false);
      setNewDocName('');
      setFileBase64(null);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewDocName(file.name);
    setFileMime(file.type || 'application/pdf');
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const shop = request?.shop;
  const owner = request?.owner;

  const [documents, setDocuments] = useState<ShopVerificationDocument[]>(() => {
    const rawDocs = request?.documents || [];
    return rawDocs.length > 0
      ? rawDocs
      : ensureDefaultKycDocuments(request?.shop || { id: request?.shop_id, name: 'Food Business' }, request?.id);
  });

  useEffect(() => {
    if (!request) return;
    let isMounted = true;
    fetchShopKycDocuments(request.shop_id, request.shop, request.id)
      .then((docs) => {
        if (isMounted && Array.isArray(docs) && docs.length > 0) {
          setDocuments(docs);
        }
      })
      .catch((err) => {
        console.warn('[VerificationDetailModal] fetchShopKycDocuments note:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [request?.id, request?.shop_id]);

  if (!request) return null;

  const commonRejectionReasons = [
    'Invalid documents',
    'Documents unclear or illegible',
    'FSSAI information missing or invalid',
    'Shop information incomplete',
    'Location verification failed',
    'Duplicate shop entry detected',
    'Business information mismatch',
    'Trade permit expired or invalid',
    'Other / Custom Feedback Required',
  ];

  const handleApproveSubmit = async () => {
    setLoadingAction(true);
    try {
      await onApprove(request.id, approvalNotes);
      setShowApproveConfirm(false);
      onClose();
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason) return;
    setLoadingAction(true);
    try {
      await onReject(request.id, {
        rejectionReason,
        customFeedback,
        rejectedDocIds: selectedRejectDocs,
      });
      setShowRejectModal(false);
      onClose();
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResubmitSimulate = async () => {
    setLoadingAction(true);
    try {
      await onResubmit(request.id);
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleRejectDoc = (docId: string) => {
    if (selectedRejectDocs.includes(docId)) {
      setSelectedRejectDocs(selectedRejectDocs.filter((id) => id !== docId));
    } else {
      setSelectedRejectDocs([...selectedRejectDocs, docId]);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-100 text-base">{shop?.name || 'Shop Review'}</h2>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                      request.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : request.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        : request.status === 'Under Review'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    }`}
                  >
                    {request.status}
                  </span>
                  {request.resubmission_count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      Revision #{request.resubmission_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                  <span>Req ID: {request.id}</span>
                  <span>·</span>
                  <span>Submitted: {new Date(request.submitted_at || request.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Rejection Alert Banner if previously rejected */}
            {request.status === 'Rejected' && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                      Application Currently Rejected
                    </h4>
                    <p className="text-xs text-rose-300 mt-1">
                      <strong>Reason:</strong> {request.rejection_reason}
                    </p>
                    {request.admin_notes && (
                      <p className="text-xs text-rose-400/80 mt-0.5">
                        <strong>Admin Feedback:</strong> {request.admin_notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResubmitSimulate}
                  disabled={loadingAction}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAction ? 'animate-spin' : ''}`} />
                  <span>Simulate Owner Resubmission</span>
                </button>
              </div>
            )}

            {/* Grid: 1. Owner Info + 2. Shop Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owner Information */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Owner Information</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Legal Name</span>
                    <span className="font-semibold text-slate-200">{owner?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Registered Email</span>
                    <span className="font-mono text-slate-200">{owner?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Phone Number</span>
                    <span className="font-mono text-slate-200 font-semibold">{owner?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Platform Role</span>
                    <span className="font-mono text-emerald-400 uppercase font-semibold">{owner?.role || 'owner'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Account Created</span>
                    <span className="font-mono text-slate-400">
                      {owner?.created_at ? new Date(owner.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shop Information */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>Shop Information</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Brand / Name</span>
                    <span className="font-semibold text-slate-200">{shop?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Format & Stall Type</span>
                    <span className="font-medium text-slate-200">
                      {shop?.is_mobile_stall ? 'Mobile Stall / Thela' : 'Permanent Restaurant'} · {shop?.stall_type || 'QSR'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Tagline / Motto</span>
                    <span className="text-slate-400 italic truncate max-w-[200px]">{shop?.tagline || 'None'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Shop Contact</span>
                    <span className="font-mono text-slate-200">{shop?.phone || shop?.contact_phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">UPI Payment ID</span>
                    <span className="font-mono text-slate-200">{shop?.upi_id || 'Not configured'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Location & Google Map Preview */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Physical Location & Geocoordinates</span>
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Accuracy: <strong className="text-slate-200 font-mono">±{shop?.location_accuracy_meters || 10}m</strong></span>
                  <span>·</span>
                  <span>Format: <strong className="text-slate-200">{shop?.is_mobile_stall ? 'Mobile Cart' : 'Permanent'}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <GoogleMapPreview
                    latitude={shop?.latitude}
                    longitude={shop?.longitude}
                    shopName={shop?.name || 'Shop Location'}
                    address={shop?.address}
                    className="h-64 w-full"
                  />
                </div>

                <div className="space-y-3 text-xs bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Street Address:</span>
                      <p className="text-slate-200 font-medium mt-0.5">{shop?.address || 'Vasai-Virar Link Road'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Area / Locality:</span>
                      <p className="text-slate-200 font-medium">{shop?.area || 'Naigaon East'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">City, State & Pincode:</span>
                      <p className="text-slate-200 font-medium">
                        {shop?.city || 'Mumbai'}, {shop?.state || 'Maharashtra'} - {shop?.pincode || '401208'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Exact Coordinates:</span>
                      <p className="font-mono text-slate-300 text-[11px] tabular-nums">
                        {shop?.latitude || 'N/A'}, {shop?.longitude || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    Last location update: {shop?.last_location_updated_at ? new Date(shop.last_location_updated_at).toLocaleString() : 'Recent'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Operations & Fulfillment Settings */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Operational Parameters & Fulfillment</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Daily Operating Hours</span>
                  <span className="font-semibold text-slate-200 mt-1 block font-mono">
                    {shop?.opening_time || '10:00 AM'} - {shop?.closing_time || '11:00 PM'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Live Operating State</span>
                  <span className={`font-semibold mt-1 block ${shop?.is_open ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {shop?.is_open ? 'Currently OPEN' : 'Currently CLOSED'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Order Modalities</span>
                  <span className="font-semibold text-slate-200 mt-1 block">
                    Takeaway & Table Service
                  </span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Delivery Radius & Fee</span>
                  <span className="font-semibold text-slate-200 mt-1 block font-mono">
                    {shop?.accepts_delivery ? `${shop?.delivery_radius_km || 3} km (${shop?.delivery_fee_type || 'Free'})` : 'No Delivery (Pickup Only)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. KYC Documents Section */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Submitted KYC Compliance Documents ({documents.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Encrypted in private storage bucket: <code className="text-emerald-400">kyc_documents</code>
                  </span>
                </div>
                {onUploadDocument && (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
                  >
                    <span>+ Attach Compliance Document</span>
                  </button>
                )}
              </div>

              {documents.length === 0 ? (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-2">
                  <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-200">
                    No compliance documents attached yet by the merchant.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    The merchant ({owner?.phone || owner?.full_name || 'shop owner'}) has registered the shop profile in Supabase. You can verify their operational parameters above, request documents by rejecting with feedback, or attach documents on their behalf.
                  </p>
                  {onUploadDocument && (
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Attach FSSAI / Trade License
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const statusBadge =
                      doc.status === 'Verified' || doc.status === 'Approved' || doc.status === 'approved'
                        ? 'Approved'
                        : doc.status === 'Rejected' || doc.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending';

                    return (
                      <div
                        key={doc.id}
                        className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200 text-xs">{doc.document_name}</span>
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
                                {getDocumentTypeLabel(doc.document_type, doc.document_name)}
                              </span>
                              {doc.document_number && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-400 font-semibold">{doc.document_number}</span>
                                </>
                              )}
                              <span>·</span>
                              <span>{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'PDF'}</span>
                              <span>·</span>
                              <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                            </div>
                            {doc.rejection_reason && (
                              <div className="text-xs text-rose-400 mt-1 font-medium">
                                Rejection reason: {doc.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDoc(doc)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Preview Document</span>
                          </button>
                          {statusBadge !== 'Approved' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await onVerifyDocument(doc.id);
                                setDocuments((prev) =>
                                  prev.map((d) => (d.id === doc.id ? { ...d, status: 'Verified' } : d))
                                );
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                          )}
                          {statusBadge !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => setSelectedDoc(doc)}
                              className="px-3 py-1.5 border border-rose-800/60 hover:bg-rose-950/40 text-rose-400 text-xs font-medium rounded-lg inline-flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Bar: Major Actions (APPROVE / REJECT) */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="text-xs text-slate-500">
              <span>Admin Decision Gateway · Every action creates an immutable audit trail</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject KYC</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApproveConfirm(true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve KYC & Activate Shop</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Approval */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Confirm Shop Approval</h3>
                <p className="text-xs text-slate-400">This will publish the shop to FoodFax customers</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Shop Name:</span>
                <span className="font-semibold text-slate-200">{shop?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Owner:</span>
                <span className="text-slate-200">{owner?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-200">{shop?.area}, {shop?.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Documents Attached:</span>
                <span className="text-emerald-400 font-semibold">{documents.length} files</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Approval Notes (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Optional administrative confirmation notes..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApproveConfirm(false)}
                disabled={loadingAction}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                disabled={loadingAction}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                {loadingAction ? 'Processing Approval...' : 'Confirm Approval & Make Public'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with Mandatory Reason & Feedback */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Reject Verification Request</h3>
                <p className="text-xs text-slate-400">Explain specific deficiencies for owner resubmission</p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Primary Reason (Mandatory)
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  required
                >
                  {commonRejectionReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Specific Corrections Required for Owner
                </label>
                <textarea
                  value={customFeedback}
                  onChange={(e) => setCustomFeedback(e.target.value)}
                  placeholder="Detail exact steps: e.g., FSSAI registration certificate photo was blurry. Please re-upload with clear 14-digit registration number."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              {documents.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Flag Defective Documents (Optional)
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-lg">
                    {documents.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRejectDocs.includes(d.id)}
                          onChange={() => toggleRejectDoc(d.id)}
                          className="rounded border-slate-700 text-rose-600 focus:ring-0"
                        />
                        <span className="truncate">{d.document_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={loadingAction}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || !rejectionReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {loadingAction ? 'Recording Rejection...' : 'Submit Rejection & Notify Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach / Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Attach Compliance Document</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Classification
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="fssai_license">FSSAI Food Safety License / Registration</option>
                  <option value="shop_business_proof">Municipal Street Food Cart Trade Permit</option>
                  <option value="owner_id_proof">Owner Identity Proof (Aadhaar / PAN)</option>
                  <option value="address_proof">Address Verification Document</option>
                  <option value="other">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Document File (PDF / Image)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Display Title
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. FSSAI License MH-2026.pdf"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={loadingAction}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || !newDocName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {loadingAction ? 'Uploading to Vault...' : 'Upload & Save to KYC Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Document Preview Modal */}
      {selectedDoc && (
        <DocumentPreviewModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onVerify={onVerifyDocument}
          onReject={onRejectDocument}
        />
      )}
    </>
  );
};
