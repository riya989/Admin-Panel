// Helper utilities to generate authentic vector certificate previews (Base64 Data URLs)
// Allows instant in-browser inspection of official compliance documents

export function generateFssaiCertificateDataUrl(shopName: string, shopAddress: string, fssaiNumber: string): string {
  const safeName = (shopName || 'Food Business').replace(/[<>&"]/g, '');
  const safeAddress = (shopAddress || 'Mumbai Region, Maharashtra').replace(/[<>&"]/g, '');
  const safeNumber = (fssaiNumber || '11524999008819').replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="100%" height="100%">
    <rect width="800" height="1050" fill="#ffffff" />
    <rect x="25" y="25" width="750" height="1000" fill="none" stroke="#15803d" stroke-width="4" />
    <rect x="35" y="35" width="730" height="980" fill="none" stroke="#ca8a04" stroke-width="1.5" />
    
    <!-- Top Header Ribbon -->
    <rect x="35" y="35" width="730" height="110" fill="#15803d" />
    <text x="400" y="75" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">
      FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA
    </text>
    <text x="400" y="105" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="#fef08a" text-anchor="middle" letter-spacing="1">
      REGISTRATION CERTIFICATE UNDER FOOD SAFETY &amp; STANDARDS ACT, 2006
    </text>
    <text x="400" y="128" font-family="Arial, sans-serif" font-size="11" fill="#dcfce7" text-anchor="middle">
      Government of Maharashtra · Public Health &amp; Food Safety Administration
    </text>

    <!-- Certificate Number Badge -->
    <rect x="180" y="170" width="440" height="48" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" />
    <text x="400" y="193" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">
      FSSAI 14-DIGIT REGISTRATION NUMBER
    </text>
    <text x="400" y="211" font-family="Courier, monospace" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="3">
      ${safeNumber}
    </text>

    <!-- Merchant Information Section -->
    <g transform="translate(70, 260)" font-family="Arial, sans-serif">
      <text x="0" y="0" font-size="15" font-weight="bold" fill="#15803d">1. Operator &amp; Establishment Details</text>
      <line x1="0" y1="10" x2="660" y2="10" stroke="#e2e8f0" stroke-width="1.5" />

      <text x="0" y="40" font-size="12" fill="#64748b">Name of Food Business Operator (FBO):</text>
      <text x="0" y="62" font-size="16" font-weight="bold" fill="#0f172a">${safeName}</text>

      <text x="0" y="100" font-size="12" fill="#64748b">Business Premise Location / Stall Address:</text>
      <text x="0" y="122" font-size="14" font-weight="600" fill="#1e293b">${safeAddress}</text>

      <text x="0" y="160" font-size="12" fill="#64748b">Kind of Business / Category:</text>
      <text x="0" y="180" font-size="13" font-weight="bold" fill="#047857">Food Vending Establishment / Street Food Preparation &amp; Takeaway</text>
    </g>

    <!-- Registration Validity & Conditions Section -->
    <g transform="translate(70, 500)" font-family="Arial, sans-serif">
      <text x="0" y="0" font-size="15" font-weight="bold" fill="#15803d">2. Registration Validity &amp; Compliance Status</text>
      <line x1="0" y1="10" x2="660" y2="10" stroke="#e2e8f0" stroke-width="1.5" />

      <rect x="0" y="25" width="310" height="70" rx="6" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="15" y="48" font-size="11" fill="#64748b">Date of Issue:</text>
      <text x="15" y="70" font-size="14" font-weight="bold" fill="#0f172a">01-Oct-2026</text>

      <rect x="340" y="25" width="320" height="70" rx="6" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="355" y="48" font-size="11" fill="#64748b">Valid Upto:</text>
      <text x="355" y="70" font-size="14" font-weight="bold" fill="#15803d">30-Sep-2031 (5 Years Active)</text>

      <text x="0" y="130" font-size="11" fill="#64748b">Jurisdiction Division:</text>
      <text x="0" y="150" font-size="12" font-weight="600" fill="#334155">Konkan Division / Thane &amp; Palghar District Food Safety Enforcement Unit</text>
    </g>

    <!-- Security Watermark & Seals -->
    <g transform="translate(70, 720)" font-family="Arial, sans-serif">
      <rect x="0" y="0" width="660" height="110" rx="8" fill="#f0fdf4" stroke="#86efac" />
      <circle cx="55" cy="55" r="35" fill="#dcfce7" stroke="#16a34a" stroke-width="2" />
      <text x="55" y="60" font-size="11" font-weight="bold" fill="#15803d" text-anchor="middle">VERIFIED</text>
      
      <text x="110" y="38" font-size="13" font-weight="bold" fill="#166534">Digitally Signed &amp; QR Verified Certificate</text>
      <text x="110" y="60" font-size="11" fill="#334155">This registration is issued under the authority of Food Safety and Standards Act, 2006.</text>
      <text x="110" y="80" font-size="11" fill="#334155">Complies with Schedule 4 hygienic practices and potable water standards.</text>
    </g>

    <!-- Footer Signatures -->
    <g transform="translate(70, 890)" font-family="Arial, sans-serif">
      <line x1="0" y1="0" x2="260" y2="0" stroke="#94a3b8" stroke-dasharray="4" />
      <text x="0" y="22" font-size="11" font-weight="bold" fill="#334155">Designated Registering Authority</text>
      <text x="0" y="38" font-size="10" fill="#64748b">Food &amp; Drug Administration (FDA Maharashtra)</text>

      <line x1="400" y1="0" x2="660" y2="0" stroke="#94a3b8" stroke-dasharray="4" />
      <text x="400" y="22" font-size="11" font-weight="bold" fill="#334155">Food Safety Officer (Zone VI)</text>
      <text x="400" y="38" font-size="10" fill="#64748b">Licensing &amp; Enforcement Officer</text>
    </g>

    <!-- Official Stamp Mark -->
    <circle cx="680" cy="940" r="45" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,3" />
    <text x="680" y="935" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle">FSSAI MUMBAI</text>
    <text x="680" y="948" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">APPROVED</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateOwnerIdCardDataUrl(ownerName: string, docNumber: string): string {
  const safeName = (ownerName || 'Merchant Operator').replace(/[<>&"]/g, '');
  const safeNumber = (docNumber || 'XXXX-XXXX-4812').replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <rect width="800" height="500" fill="#ffffff" />
    <rect x="20" y="20" width="760" height="460" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
    
    <!-- Top Header -->
    <path d="M20 36 Q20 20 36 20 L764 20 Q780 20 780 36 L780 80 L20 80 Z" fill="#0f172a" />
    <text x="400" y="52" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      GOVERNMENT OF INDIA · OFFICIAL IDENTITY CARD (MASKED)
    </text>
    <text x="400" y="70" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">
      Unique Identification / Tax Compliance Identity Proof (Self-Attested)
    </text>

    <!-- Photo Placeholder Box -->
    <rect x="60" y="120" width="160" height="200" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
    <circle cx="140" cy="190" r="40" fill="#cbd5e1" />
    <path d="M85 290 Q140 240 195 290" fill="#94a3b8" />
    <text x="140" y="305" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#475569" text-anchor="middle">
      CITIZEN PHOTO
    </text>

    <!-- Citizen Details -->
    <g transform="translate(260, 140)" font-family="Arial, sans-serif">
      <text x="0" y="0" font-size="12" fill="#64748b">Full Name of Card Holder:</text>
      <text x="0" y="28" font-size="20" font-weight="bold" fill="#0f172a">${safeName}</text>

      <text x="0" y="70" font-size="12" fill="#64748b">Identity Document Type:</text>
      <text x="0" y="92" font-size="14" font-weight="600" fill="#334155">Aadhaar Card (UIDAI Masked) / PAN Identity</text>

      <text x="0" y="135" font-size="12" fill="#64748b">Identity Number (Last 4 Digits Visible):</text>
      <text x="0" y="165" font-family="Courier, monospace" font-size="22" font-weight="bold" fill="#0f172a" letter-spacing="2">
        ${safeNumber}
      </text>
    </g>

    <!-- Verification Banner -->
    <rect x="60" y="360" width="680" height="70" rx="8" fill="#f0fdf4" stroke="#86efac" />
    <text x="90" y="392" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#166534">
      ✓ Verified for Merchant Stall Compliance
    </text>
    <text x="90" y="412" font-family="Arial, sans-serif" font-size="11" fill="#334155">
      UIDAI / Income Tax Department guidelines compliant. Digitally verified for FoodFax vendor registration.
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateAddressProofDataUrl(shopName: string, shopAddress: string, billNumber: string): string {
  const safeName = (shopName || 'Food Business').replace(/[<>&"]/g, '');
  const safeAddress = (shopAddress || 'Vasai West, Mumbai').replace(/[<>&"]/g, '');
  const safeNumber = (billNumber || 'MH-MUM-401202-8821').replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
    <rect width="800" height="1000" fill="#ffffff" />
    <rect x="25" y="25" width="750" height="950" fill="none" stroke="#cbd5e1" stroke-width="2" />

    <!-- Utility Header -->
    <rect x="25" y="25" width="750" height="100" fill="#0369a1" />
    <text x="400" y="65" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">
      MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.
    </text>
    <text x="400" y="95" font-family="Arial, sans-serif" font-size="12" fill="#e0f2fe" text-anchor="middle">
      Commercial Stall Power Connection &amp; Address Verification Certificate
    </text>

    <!-- Consumer & Meter Info -->
    <g transform="translate(60, 160)" font-family="Arial, sans-serif">
      <rect x="0" y="0" width="680" height="85" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="20" y="30" font-size="11" fill="#64748b">Consumer Account / Billing No:</text>
      <text x="20" y="55" font-family="Courier, monospace" font-size="18" font-weight="bold" fill="#0f172a">${safeNumber}</text>

      <text x="360" y="30" font-size="11" fill="#64748b">Tariff Category:</text>
      <text x="360" y="55" font-size="14" font-weight="bold" fill="#0369a1">LT-II Commercial Stall Metered</text>

      <text x="0" y="125" font-size="13" font-weight="bold" fill="#0369a1">Service Address / Stall Location:</text>
      <text x="0" y="152" font-size="15" font-weight="bold" fill="#0f172a">${safeName}</text>
      <text x="0" y="178" font-size="13" fill="#334155">${safeAddress}</text>

      <!-- Proof verification status -->
      <rect x="0" y="220" width="680" height="120" rx="8" fill="#f0fdf4" stroke="#86efac" />
      <text x="25" y="255" font-size="15" font-weight="bold" fill="#166534">Address Verification Summary</text>
      <text x="25" y="280" font-size="12" fill="#334155">Premise inspection confirmed active commercial operation and utility billing address match.</text>
      <text x="25" y="305" font-size="12" fill="#334155">Meter status: OK / Normal · No dues pending as of current billing cycle.</text>
    </g>

    <!-- Municipal stamp -->
    <circle cx="660" cy="780" r="50" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,3" />
    <text x="660" y="775" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">MSEDCL VASAI</text>
    <text x="660" y="792" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#0284c7" text-anchor="middle">VERIFIED</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateTradePermitDataUrl(shopName: string, shopAddress: string, permitNumber: string): string {
  const safeName = (shopName || 'Food Business').replace(/[<>&"]/g, '');
  const safeAddress = (shopAddress || 'Naigaon East, Mumbai').replace(/[<>&"]/g, '');
  const safeNumber = (permitNumber || 'VVMC/TF/2026-8819').replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
    <rect width="800" height="1000" fill="#ffffff" />
    <rect x="25" y="25" width="750" height="950" fill="none" stroke="#b45309" stroke-width="3" />
    <rect x="35" y="35" width="730" height="930" fill="none" stroke="#f59e0b" stroke-width="1" />

    <!-- Municipal Header -->
    <rect x="35" y="35" width="730" height="110" fill="#78350f" />
    <text x="400" y="75" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      MUNICIPAL CORPORATION STREET FOOD VENDING PERMIT
    </text>
    <text x="400" y="105" font-family="Arial, sans-serif" font-size="12" fill="#fde68a" text-anchor="middle">
      Town Vending Committee (TVC) Certificate of Vending Under Street Vendors Act
    </text>

    <!-- Permit Badge -->
    <rect x="180" y="170" width="440" height="50" rx="8" fill="#fffbeb" stroke="#fcd34d" stroke-width="1.5" />
    <text x="400" y="193" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#92400e" text-anchor="middle">
      MUNICIPAL VENDING PERMIT NUMBER
    </text>
    <text x="400" y="212" font-family="Courier, monospace" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="2">
      ${safeNumber}
    </text>

    <!-- Vending Details -->
    <g transform="translate(70, 260)" font-family="Arial, sans-serif">
      <text x="0" y="0" font-size="14" font-weight="bold" fill="#78350f">Establishment &amp; Vending Authorization</text>
      <line x1="0" y1="10" x2="660" y2="10" stroke="#e2e8f0" stroke-width="1.5" />

      <text x="0" y="40" font-size="12" fill="#64748b">Authorized Vendor Name:</text>
      <text x="0" y="62" font-size="16" font-weight="bold" fill="#0f172a">${safeName}</text>

      <text x="0" y="100" font-size="12" fill="#64748b">Designated Vending Zone &amp; Territory:</text>
      <text x="0" y="122" font-size="14" font-weight="600" fill="#1e293b">${safeAddress}</text>

      <text x="0" y="160" font-size="12" fill="#64748b">Vending Cart / Stall Classification:</text>
      <text x="0" y="180" font-size="13" font-weight="bold" fill="#b45309">Approved Mobile Street Food Stall / Dedicated Takeaway Kiosk</text>
    </g>

    <g transform="translate(70, 500)" font-family="Arial, sans-serif">
      <rect x="0" y="0" width="660" height="110" rx="8" fill="#f0fdf4" stroke="#86efac" />
      <text x="25" y="35" font-size="14" font-weight="bold" fill="#166534">Municipal Health Department Clearance</text>
      <text x="25" y="60" font-size="11" fill="#334155">Operator has passed street food hygiene guidelines and waste disposal inspection.</text>
      <text x="25" y="80" font-size="11" fill="#334155">Permitted operating times comply with local municipal ward regulations.</text>
    </g>

    <!-- Seal -->
    <circle cx="670" cy="880" r="45" fill="none" stroke="#78350f" stroke-width="2.5" stroke-dasharray="5,2" />
    <text x="670" y="876" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#78350f" text-anchor="middle">MUNICIPAL WARD</text>
    <text x="670" y="890" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#78350f" text-anchor="middle">APPROVED</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
