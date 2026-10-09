import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, FileText, Download, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ShopVerificationDocument } from '../../types/admin';

interface DocumentPreviewModalProps {
  document: ShopVerificationDocument | null;
  onClose: () => void;
  onVerify?: (docId: string) => Promise<void>;
  onReject?: (docId: string, reason: string) => Promise<void>;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
  onVerify,
  onReject,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!document) return null;

  const previewUrl = document.signed_url || document.file_url;
  const isPdf =
    document.mime_type === 'application/pdf' ||
    document.storage_path?.endsWith('.pdf') ||
    previewUrl?.startsWith('data:application/pdf') ||
    (Boolean(previewUrl?.includes('.pdf')) && !previewUrl?.startsWith('data:image'));
  const isImage =
    document.mime_type?.startsWith('image/') ||
    previewUrl?.startsWith('data:image/') ||
    Boolean(previewUrl?.includes('data:image/svg+xml')) ||
    /\.(png|jpe?g|webp|svg)$/i.test(document.storage_path || '') ||
    (Boolean(previewUrl) && /\.(png|jpe?g|webp|svg)/i.test(previewUrl || ''));

  const handleVerify = async () => {
    if (!onVerify) return;
    setLoading(true);
    try {
      await onVerify(document.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !onReject) return;
    setLoading(true);
    try {
      await onReject(document.id, reason.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">{document.document_name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="capitalize">{document.document_type.replace(/_/g, ' ')}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">{document.file_size ? `${Math.round(document.file_size / 1024)} KB` : 'Encrypted file'}</span>
                <span>·</span>
                <span
                  className={
                    document.status === 'Verified'
                      ? 'text-emerald-400 font-medium'
                      : document.status === 'Rejected'
                      ? 'text-rose-400 font-medium'
                      : 'text-amber-400 font-medium'
                  }
                >
                  Status: {document.status}
                </span>
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

        {/* Document Viewer Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950/50 flex flex-col items-center justify-center min-h-[350px]">
          {previewUrl ? (
            isImage ? (
              <img
                src={previewUrl}
                alt={document.document_name}
                className="max-h-[60vh] max-w-full rounded border border-slate-800 object-contain shadow-md"
              />
            ) : isPdf ? (
              <iframe
                src={previewUrl.startsWith('data:') ? previewUrl : `${previewUrl}#toolbar=0`}
                title={document.document_name}
                className="w-full h-[60vh] rounded border border-slate-800 bg-white"
              />
            ) : (
              <div className="text-center p-8">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-300 font-medium">{document.document_name}</p>
                <p className="text-xs text-slate-500 mt-1">Binary file preview not supported in browser frame.</p>
                <a
                  href={previewUrl}
                  download={document.document_name}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Original Document
                </a>
              </div>
            )
          ) : (
            <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-xl max-w-md">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">Private KYC Storage Document</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                This document is safely secured in the private <code className="text-emerald-400">kyc_documents</code> bucket.
                Storage path: <span className="font-mono text-slate-300">{document.storage_path}</span>
              </p>
            </div>
          )}

          {document.rejection_reason && (
            <div className="mt-4 w-full p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-200">Rejection Note:</span> {document.rejection_reason}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">Uploaded: {new Date(document.uploaded_at).toLocaleString()}</span>
          </div>

          {!rejecting ? (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{previewUrl.startsWith('data:') ? 'Open File / Download' : 'Download'}</span>
                </a>
              )}
              {onReject && (
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  disabled={loading}
                  className="px-3 py-1.5 border border-rose-800/60 hover:bg-rose-950/40 text-rose-400 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Document</span>
                </button>
              )}
              {onVerify && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={loading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-950"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Verified</span>
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleRejectSubmit} className="flex-1 flex items-center gap-2 w-full">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter document rejection reason (e.g. FSSAI number illegible)..."
                required
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Confirm Reject
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
