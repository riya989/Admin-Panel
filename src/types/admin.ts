export type UserRole = 'admin' | 'owner' | 'customer';

export interface UserProfile {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  photo_url?: string | null;
  role: UserRole;
  shop_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
  city?: string | null;
  profile_completed?: boolean;
  is_active: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug?: string | null;
  stall_type: string | null;
  tagline?: string | null;
  description?: string | null;
  image?: string | null;
  banner_image?: string | null;
  phone?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude: number | null;
  longitude: number | null;
  upi_id?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  opening_hours?: string | null;
  is_open: boolean;
  is_active: boolean;
  is_pure_veg?: boolean;
  rating?: number | null;
  total_reviews?: number;
  preparation_time_minutes?: string | null;
  featured_item?: string | null;
  is_rush_hour?: boolean;
  table_service_available?: boolean;
  categories?: string[];
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
  is_mobile_stall?: boolean;
  location_accuracy_meters?: number | null;
  last_location_updated_at?: string | null;
  accepts_delivery?: boolean;
  delivery_radius_km?: number | null;
  delivery_fee_type?: string | null;
  delivery_fee_amount?: number | null;
  verification_status?: VerificationStatus;
  kyc_status?: string | null;
  re_kyc?: boolean;
  operational_status?: ShopOperationalStatus;
  status?: string;
}

export type ShopOperationalStatus =
  | 'Active'
  | 'Maintenance'
  | 'Archived'
  | 'Suspended'
  | 'Under Inspection'
  | 'Seasonal Closure'
  | string;

export type VerificationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Suspended'
  | 'rekyc'
  | 'Re-KYC'
  | string;

export type DocumentType =
  | 'fssai_license'
  | 'shop_business_proof'
  | 'owner_id_proof'
  | 'address_proof'
  | 'other';

export type DocumentStatus = 'Pending' | 'Verified' | 'Rejected';

export interface ShopVerificationDocument {
  id: string;
  verification_request_id: string;
  document_type: DocumentType | string;
  document_name: string;
  document_number?: string | null;
  storage_path: string;
  file_url?: string | null;
  file_size?: number;
  mime_type?: string;
  status: DocumentStatus | string;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  uploaded_at: string;
  signed_url?: string | null;
}

export interface ShopVerificationRequest {
  id: string;
  shop_id: string;
  owner_id: string;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  resubmission_count: number;
  created_at: string;
  updated_at: string;
  shop?: Shop;
  owner?: UserProfile;
  documents?: ShopVerificationDocument[];
}

export interface Customer {
  id: string;
  phone: string;
  email?: string | null;
  full_name: string;
  photo_url?: string | null;
  area?: string | null;
  city?: string | null;
  pincode?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  saved_shop_ids?: string[];
  preferred_location?: string | null;
  profile_completed?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  order_count?: number;
}

export interface Order {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_image?: string | null;
  shop_location?: string | null;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  token_number: string;
  order_type: 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY';
  table_number?: string | null;
  payment_method: 'PAY_ONLINE' | 'CASH_AT_COUNTER' | 'UPI';
  payment_status: 'PAID' | 'PENDING' | 'FAILED';
  order_status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  total: number;
  estimated_preparation_minutes?: string | null;
  instructions?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
  rating?: number | null;
  review_text?: string | null;
  reviewed_at?: string | null;
  feedback_tags?: string[];
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  name: string;
  price: number;
  quantity: number;
  is_veg?: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  shop_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  is_veg: boolean;
  is_available: boolean;
  is_bestseller: boolean;
  preparation_time_min?: number;
  preparation_minutes?: string;
  display_order?: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  reason?: string | null;
  metadata?: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

export interface PlatformReport {
  id: string;
  reporter_id?: string | null;
  reporter_name?: string | null;
  reporter_role?: string | null;
  target_type: 'shop' | 'customer' | 'order' | 'platform' | 'kyc';
  target_id?: string | null;
  target_name?: string | null;
  category:
    | 'Shop complaint'
    | 'Customer complaint'
    | 'Payment issue'
    | 'Order issue'
    | 'KYC issue'
    | 'Fraud/suspicious activity'
    | 'Technical issue'
    | 'Other';
  description: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  admin_notes?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalShops: number;
  pendingKyc: number;
  approvedShops: number;
  rejectedShops: number;
  activeShops: number;
  currentlyOpenShops: number;
  mobileStalls: number;
  permanentRestaurants: number;
  totalCustomers: number;
  totalOrders: number;
  todayOrders: number;
  todaySales: number;
  totalSales: number;
  pendingReports: number;
  recentShops: Shop[];
  recentKycRequests: ShopVerificationRequest[];
  recentOrders: Order[];
  sevenDayTrends?: Array<{
    date: string;
    day: string;
    activeUsers: number;
    orderVolume: number;
    pendingKyc: number;
    dailyNewVerifications?: number;
  }>;
}
