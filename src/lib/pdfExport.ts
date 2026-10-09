import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Shop, ShopVerificationRequest } from '../types/admin';

interface VerificationPdfOptions {
  requests: ShopVerificationRequest[];
  totalInView?: number;
  isSelectedOnly?: boolean;
  filters: {
    statusFilter?: string;
    searchTerm?: string;
  };
  adminEmail?: string;
  customFilename?: string;
}

interface ShopsPdfOptions {
  shops: Shop[];
  totalInView?: number;
  isSelectedOnly?: boolean;
  filters: {
    search?: string;
    operationalStatus?: string;
    stallType?: string;
    city?: string;
    isOpen?: string;
  };
  adminEmail?: string;
  customFilename?: string;
}

/**
 * Formats date into readable string.
 */
function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Draws the professional FoodFax branded top header and summary metadata box.
 */
function drawReportHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  filterItems: Array<{ label: string; value: string }>,
  scopeText: string,
  adminEmail?: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateFormatted = now.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 1. Top Decorative Brand Bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('FOODFAX PLATFORM GOVERNANCE', 30, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(title + ' — ' + subtitle, 30, 39);

  // 3. Right Header Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('CONFIDENTIAL & PRIVILEGED', pageWidth - 30, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${dateFormatted}`, pageWidth - 30, 32, { align: 'right' });
  doc.text(`Auditor: ${adminEmail || 'admin@foodfax.in'}`, pageWidth - 30, 43, { align: 'right' });

  // 4. Summary Header Box with Current Filtering State
  const boxTop = 50;
  const boxHeight = 44;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.roundedRect(30, boxTop, pageWidth - 60, boxHeight, 4, 4, 'FD');

  // Left accent strip on box
  doc.setFillColor(16, 185, 129);
  doc.rect(30, boxTop, 3.5, boxHeight, 'F');

  // Box Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('ACTIVE FILTERING STATE & AUDIT SCOPE SUMMARY:', 40, boxTop + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(scopeText, pageWidth - 40, boxTop + 13, { align: 'right' });

  // Render Filter Items in 4 columns
  doc.setFontSize(8);
  const colCount = Math.min(filterItems.length, 4);
  const colWidth = (pageWidth - 80) / colCount;

  filterItems.slice(0, 4).forEach((item, idx) => {
    const x = 40 + idx * colWidth;
    const y = boxTop + 27;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label + ':', x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const valueText = doc.splitTextToSize(item.value || 'All', colWidth - 10)[0];
    doc.text(valueText, x, y + 10);
  });
}

/**
 * Adds page numbers and legal disclaimer to all pages.
 */
function addPageFooters(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(30, pageHeight - 20, pageWidth - 30, pageHeight - 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'FoodFax Administrative Governance System · Official compliance audit log. Reproduction prohibited without clearance.',
      30,
      pageHeight - 10
    );

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10, { align: 'right' });
  }
}

/**
 * Export selected or filtered Verification requests to a polished PDF Report.
 */
export function exportVerificationsToPDF(options: VerificationPdfOptions): number {
  const {
    requests,
    totalInView = requests.length,
    isSelectedOnly = false,
    filters,
    adminEmail,
    customFilename,
  } = options;

  if (requests.length === 0) return 0;

  // Initialize Landscape A4 document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const scopeText = isSelectedOnly
    ? `Selection Scope: ${requests.length} Application(s) (of ${totalInView} in view)`
    : `Total Scope: ${requests.length} Application(s) (Full Filtered Queue)`;

  const filterSummary = [
    {
      label: 'Status Queue',
      value: filters.statusFilter && filters.statusFilter !== 'all' ? filters.statusFilter : 'All Statuses (Full Pipeline)',
    },
    {
      label: 'Search Query',
      value: filters.searchTerm?.trim() ? `"${filters.searchTerm.trim()}"` : 'None (No text filter applied)',
    },
    {
      label: 'Approved Ratio',
      value: `${requests.filter((r) => r.status === 'Approved').length} Approved / ${requests.filter((r) => r.status === 'Rejected').length} Rejected`,
    },
    {
      label: 'Pending Review',
      value: `${requests.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length} Awaiting Action`,
    },
  ];

  drawReportHeader(
    doc,
    'KYC & SHOP VERIFICATION AUDIT DOSSIER',
    'Merchant Compliance & Municipal Regulatory Report',
    filterSummary,
    scopeText,
    adminEmail
  );

  // Table Data Columns
  const headers = [
    'App ID',
    'Shop / Outlet Name',
    'Stall Format',
    'Legal Owner / Contact',
    'City & Area',
    'KYC Documents',
    'Submitted At',
    'Decision Status',
  ];

  const rows = requests.map((req) => {
    const docs = req.documents || [];
    const verifiedDocs = docs.filter((d) => d.status === 'Verified').length;
    const pendingDocs = docs.filter((d) => d.status === 'Pending').length;
    const rejectedDocs = docs.filter((d) => d.status === 'Rejected').length;
    const docSummary = `${docs.length} docs (${verifiedDocs} Verif, ${pendingDocs} Pend, ${rejectedDocs} Rej)`;

    return [
      req.id,
      req.shop?.name || 'Unnamed Outlet',
      req.shop?.stall_type || (req.shop?.is_mobile_stall ? 'Mobile Stall' : 'Permanent'),
      `${req.owner?.full_name || 'N/A'}\n${req.owner?.phone || req.shop?.phone || 'No Phone'}`,
      `${req.shop?.city || 'Mumbai'}\n${req.shop?.area || req.shop?.pincode || ''}`,
      docSummary,
      formatDateTime(req.submitted_at || req.created_at),
      req.status,
    ];
  });

  autoTable(doc, {
    startY: 104,
    head: [headers],
    body: rows,
    theme: 'striped',
    margin: { left: 30, right: 30, bottom: 30 },
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [15, 23, 42],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 70, font: 'courier' }, // ID
      1: { cellWidth: 120, fontStyle: 'bold' }, // Shop Name
      2: { cellWidth: 85 }, // Stall Format
      3: { cellWidth: 125 }, // Owner
      4: { cellWidth: 105 }, // City & Area
      5: { cellWidth: 105, fontSize: 7.5 }, // Docs
      6: { cellWidth: 85, fontSize: 7.5 }, // Date
      7: { cellWidth: 75, fontStyle: 'bold' }, // Status
    },
    didParseCell: (data) => {
      // Color-code the Status cell
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw || '');
        if (val === 'Approved') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (val === 'Rejected' || val === 'Suspended') {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        } else {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        }
      }
    },
  });

  addPageFooters(doc);

  const dateSuffix = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `foodfax_kyc_verification_report_${dateSuffix}.pdf`;
  doc.save(filename);

  return requests.length;
}

/**
 * Export selected or filtered Shops to a polished PDF Report.
 */
export function exportShopsToPDF(options: ShopsPdfOptions): number {
  const {
    shops,
    totalInView = shops.length,
    isSelectedOnly = false,
    filters,
    adminEmail,
    customFilename,
  } = options;

  if (shops.length === 0) return 0;

  // Initialize Landscape A4 document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const scopeText = isSelectedOnly
    ? `Selection Scope: ${shops.length} Selected Shop(s) (of ${totalInView} in view)`
    : `Total Scope: ${shops.length} Shop(s) (Full Filtered Directory)`;

  const filterSummary = [
    {
      label: 'Operational Status',
      value: filters.operationalStatus && filters.operationalStatus !== 'all' ? filters.operationalStatus : 'All States (Active/Maint/Archived)',
    },
    {
      label: 'Stall Category',
      value: filters.stallType && filters.stallType !== 'all' ? filters.stallType : 'All Formats (Mobile & Fixed)',
    },
    {
      label: 'City Filter',
      value: filters.city && filters.city !== 'all' ? filters.city : 'All Territories',
    },
    {
      label: 'Search Query',
      value: filters.search?.trim() ? `"${filters.search.trim()}"` : 'None (No keyword filter)',
    },
  ];

  drawReportHeader(
    doc,
    'MERCHANT SHOPS & OUTLETS DIRECTORY',
    'Operational Status & Stall Inventory Inspection Report',
    filterSummary,
    scopeText,
    adminEmail
  );

  // Table Data Columns
  const headers = [
    'Shop ID',
    'Shop Name',
    'Category / Format',
    'Owner / Phone',
    'Location (City, Area, Pincode)',
    'Operational Status',
    'Operating State',
    'KYC Status',
    'Registered',
  ];

  const rows = shops.map((s) => {
    const opStatus = s.operational_status || (s.is_active ? 'Active' : 'Suspended');
    const openState = s.is_open ? 'Open Now' : 'Closed';
    const kycState = s.verification_status || (s.is_active ? 'Approved' : 'Submitted');

    return [
      s.id,
      s.name,
      `${s.stall_type || 'Fast Food'}\n(${s.is_mobile_stall ? 'Mobile Stall' : 'Fixed Place'})`,
      `${(s as any).owner_name || s.owner_id || 'Owner'}\n${s.phone || s.contact_phone || 'N/A'}`,
      `${s.city || 'Mumbai'} - ${s.pincode || ''}\n${s.area || s.address || ''}`,
      opStatus,
      openState,
      kycState,
      formatDateTime(s.created_at),
    ];
  });

  autoTable(doc, {
    startY: 104,
    head: [headers],
    body: rows,
    theme: 'striped',
    margin: { left: 30, right: 30, bottom: 30 },
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [15, 23, 42],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 65, font: 'courier' }, // ID
      1: { cellWidth: 120, fontStyle: 'bold' }, // Shop Name
      2: { cellWidth: 85 }, // Category
      3: { cellWidth: 115 }, // Owner
      4: { cellWidth: 115 }, // Location
      5: { cellWidth: 80, fontStyle: 'bold' }, // Operational Status
      6: { cellWidth: 65 }, // Open/Closed
      7: { cellWidth: 70 }, // KYC
      8: { cellWidth: 65, fontSize: 7 }, // Registered Date
    },
    didParseCell: (data) => {
      // Color-code the Operational Status cell
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw || '');
        if (val === 'Active') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (val === 'Maintenance') {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        } else if (val === 'Archived') {
          data.cell.styles.textColor = [100, 116, 139]; // slate-500
        } else if (val === 'Suspended') {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        }
      }
      // Color-code Operating State
      if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw || '');
        if (val === 'Open Now') {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
  });

  addPageFooters(doc);

  const dateSuffix = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `foodfax_shops_directory_report_${dateSuffix}.pdf`;
  doc.save(filename);

  return shops.length;
}
