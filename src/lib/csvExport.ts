import type { Shop, ShopVerificationRequest } from '../types/admin';

/**
 * Escapes and formats a single value for CSV compliance (RFC 4180).
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  // If value contains double quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers native browser download of a generated CSV string with UTF-8 BOM.
 */
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const headerLine = headers.map(escapeCsvValue).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvValue).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a date string into readable YYYY-MM-DD HH:mm format.
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().replace('T', ' ').slice(0, 16);
  } catch {
    return dateStr;
  }
}

/**
 * Exports an array of KYC ShopVerificationRequest objects into CSV.
 */
export function exportVerificationsToCSV(
  requests: ShopVerificationRequest[],
  customFilename?: string
): number {
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `foodfax_verifications_${dateSuffix}.csv`;

  const headers = [
    'Application ID',
    'Shop ID',
    'Shop Name',
    'Stall Type',
    'City',
    'Area / Address',
    'Owner ID',
    'Owner Name',
    'Contact Phone',
    'Owner Email',
    'Status',
    'Submitted At',
    'Reviewed At',
    'Reviewed By',
    'Total Documents',
    'Verified Documents',
    'Pending Documents',
    'Rejected Documents',
    'Rejection Reason',
    'Admin Notes',
  ];

  const rows = requests.map((req) => {
    const shop = req.shop;
    const owner = req.owner;
    const docs = req.documents || [];
    const verifiedDocs = docs.filter((d) => d.status === 'Verified').length;
    const pendingDocs = docs.filter((d) => d.status === 'Pending').length;
    const rejectedDocs = docs.filter((d) => d.status === 'Rejected').length;

    return [
      req.id,
      req.shop_id,
      shop?.name || 'Unnamed Outlet',
      shop?.stall_type || (shop?.is_mobile_stall ? 'Mobile Stall' : 'Permanent Stall'),
      shop?.city || '',
      shop?.area || shop?.address || '',
      req.owner_id,
      owner?.full_name || '',
      owner?.phone || shop?.phone || shop?.contact_phone || '',
      owner?.email || '',
      req.status,
      formatDate(req.submitted_at || req.created_at),
      formatDate(req.reviewed_at),
      req.reviewed_by || '',
      docs.length,
      verifiedDocs,
      pendingDocs,
      rejectedDocs,
      req.rejection_reason || '',
      req.admin_notes || '',
    ];
  });

  downloadCSV(filename, headers, rows);
  return requests.length;
}

/**
 * Exports an array of Shop objects into CSV.
 */
export function exportShopsToCSV(
  shops: Shop[],
  customFilename?: string
): number {
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `foodfax_shops_${dateSuffix}.csv`;

  const headers = [
    'Shop ID',
    'Shop Name',
    'Stall Category',
    'Format',
    'Contact Phone',
    'City',
    'Area / Locality',
    'Pincode',
    'Address',
    'Active Status',
    'Current Store Status',
    'Verification Status',
    'Owner ID',
    'Accepts Delivery',
    'Created At',
    'Last Updated',
  ];

  const rows = shops.map((shop) => [
    shop.id,
    shop.name,
    shop.stall_type || (shop.is_mobile_stall ? 'Mobile Stall' : 'Permanent Stall'),
    shop.is_mobile_stall ? 'Mobile Street Vendor' : 'Fixed Establishment',
    shop.phone || shop.contact_phone || '',
    shop.city || '',
    shop.area || '',
    shop.pincode || '',
    shop.address || '',
    shop.is_active ? 'Active' : 'Inactive',
    shop.is_open ? 'Open' : 'Closed',
    shop.verification_status || (shop.is_active ? 'Approved' : 'Submitted'),
    shop.owner_id,
    shop.accepts_delivery ? 'Yes' : 'No',
    formatDate(shop.created_at),
    formatDate(shop.updated_at),
  ]);

  downloadCSV(filename, headers, rows);
  return shops.length;
}
