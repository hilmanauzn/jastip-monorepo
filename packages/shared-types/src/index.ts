// ============================================
// SHARED TYPES - Core domain types
// ============================================

export type Role = 'SUPER_ADMIN' | 'ADMIN_TENANT' | 'STAFF' | string;

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' | string;
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED' | string;

export type RuleType = 'PER_UNIT' | 'PER_MULTIPLE' | 'PER_ORDER' | 'TIERED' | string;
export type AppliesTo = 'ALL' | 'INCLUDE_JASTIP' | string;

// ============================================
// TENANT
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logoUrl?: string | null;
  settings?: Record<string, unknown> | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  settings?: Record<string, unknown> | string;
}

export interface UpdateTenantInput {
  name?: string;
  slug?: string;
  domain?: string | null;
  logoUrl?: string | null;
  settings?: Record<string, unknown> | string | null;
  isActive?: boolean;
}

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  lastLoginAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: Role;
  tenantId: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: Role;
  password?: string;
}

// ============================================
// RESTAURANT
// ============================================

export interface Restaurant {
  id: string;
  name: string;
  jastipFee: number;
  multiple: number;
  taxService: number;
  taxCharge: number;
  isActive: boolean;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: { menus: number };
  jastipOverride?: number | null;
}

export interface CreateRestaurantInput {
  name: string;
  jastipFee: number;
  multiple?: number;
  taxService?: number;
  taxCharge?: number;
  isActive?: boolean;
  tenantId: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  jastipFee?: number;
  multiple?: number;
  taxService?: number;
  taxCharge?: number;
  isActive?: boolean;
}

// ============================================
// MENU
// ============================================

export interface MenuItem {
  id: string;
  externalId?: string | null;
  restaurantId: string;
  restaurant?: Restaurant;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  includeJastip: boolean;
  jastipFeeSpecial?: number | null;
  addons: string[];
  imageUrl?: string | null;
  isAvailable: boolean;
  sortOrder: number;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateMenuItemInput {
  restaurantId: string;
  externalId?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  includeJastip?: boolean;
  jastipFeeSpecial?: number;
  addons?: string[];
  imageUrl?: string;
  isAvailable?: boolean;
  sortOrder?: number;
  tenantId: string;
}

export interface UpdateMenuItemInput {
  restaurantId?: string;
  externalId?: string | null;
  name?: string;
  description?: string | null;
  price?: number;
  category?: string;
  includeJastip?: boolean;
  jastipFeeSpecial?: number | null;
  addons?: string[];
  imageUrl?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  tenantId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// JASTIP RULES
// ============================================

export interface JastipRuleGlobal {
  id: string;
  type: RuleType;
  multiple: number;
  fee: number;
  appliesTo: AppliesTo;
  minOrderQty: number;
  maxFee?: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface JastipRuleTenant {
  id: string;
  tenantId: string;
  type?: RuleType | null;
  multiple?: number | null;
  fee?: number | null;
  appliesTo?: AppliesTo | null;
  minOrderQty?: number | null;
  maxFee?: number | null;
  useGlobalRule: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface JastipRuleTier {
  id: string;
  ruleId: string;
  minQty: number;
  maxQty?: number | null;
  fee: number;
  createdAt: Date | string;
}

export interface CreateJastipRuleGlobalInput {
  type?: RuleType;
  multiple?: number;
  fee?: number;
  appliesTo?: AppliesTo;
  minOrderQty?: number;
  maxFee?: number;
}

export interface UpdateJastipRuleGlobalInput {
  type?: RuleType;
  multiple?: number;
  fee?: number;
  appliesTo?: AppliesTo;
  minOrderQty?: number;
  maxFee?: number | null;
  isActive?: boolean;
}

export interface UpdateJastipRuleTenantInput {
  type?: RuleType | null;
  multiple?: number | null;
  fee?: number | null;
  appliesTo?: AppliesTo | null;
  minOrderQty?: number | null;
  maxFee?: number | null;
  useGlobalRule?: boolean;
}

// ============================================
// CUSTOMER
// ============================================

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  tenantId: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
}

// ============================================
// ORDERS
// ============================================

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customer?: Customer | null;
  customerName: string;
  status: OrderStatus;
  subtotal: number;
  jastipFeeTotal: number;
  taxServiceTotal: number;
  taxChargeTotal: number;
  grandTotal: number;
  ongkir: number;
  destination?: string | null;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: OrderItem[];
  restaurantFees?: OrderRestaurantFee[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId?: string | null;
  name: string;
  description?: string | null;
  price: number;
  basePrice?: number | null;
  quantity: number;
  category: string;
  includeJastip: boolean;
  jastipFeeSpecial?: number | null;
  selectedAddon?: string | null;
  isManual: boolean;
  subtotal: number;
  createdAt: Date | string;
}

export interface OrderRestaurantFee {
  id: string;
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  subtotal: number;
  subtotalTaxable: number;
  subtotalNonTax: number;
  calculatedFee: number;
  overrideFee?: number | null;
  finalFee: number;
  taxServiceAmount: number;
  taxChargeAmount: number;
  total: number;
  totalQuantity: number;
  qtyIncludeJastip: number;
  multiple: number;
  batches: number;
  hasMultipleWarning: boolean;
  createdAt: Date | string;
}

export interface CreateOrderInput {
  customerId?: string;
  customerName: string;
  items: CreateOrderItemInput[];
  ongkir?: number;
  destination?: string;
  notes?: string;
  jastipOverrides?: Record<string, number>;
  tenantId: string;
}

export interface CreateOrderItemInput {
  menuItemId?: string;
  name: string;
  description?: string;
  price: number;
  basePrice?: number;
  quantity: number;
  category: string;
  includeJastip?: boolean;
  jastipFeeSpecial?: number;
  selectedAddon?: string;
  isManual?: boolean;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface UpdateOrderPaymentInput {
  paymentStatus: PaymentStatus;
}

export interface OrderPreviewInput {
  items: CreateOrderItemInput[];
  ongkir?: number;
  destination?: string;
  jastipOverrides?: Record<string, number>;
  tenantId: string;
}

// ============================================
// SETTINGS
// ============================================

export interface Settings {
  id: string;
  tenantId: string;
  shopName: string;
  tagline: string;
  bankAccounts: string[];
  qrisImageUrl?: string | null;
  logoUrl?: string | null;
  updatedAt: Date | string;
}

export interface UpdateSettingsInput {
  shopName?: string;
  tagline?: string;
  bankAccounts?: string[];
  qrisImageUrl?: string | null;
  logoUrl?: string | null;
}

// ============================================
// ANALYTICS
// ============================================

export interface SalesAnalytics {
  period: 'daily' | 'weekly' | 'monthly';
  data: SalesDataPoint[];
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalJastipFee: number;
    avgOrderValue: number;
  };
}

export interface SalesDataPoint {
  date: string;
  orders: number;
  revenue: number;
  jastipFee: number;
}

export interface TopItemAnalytics {
  menuItemId: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

export interface CategoryAnalytics {
  category: string;
  orders: number;
  revenue: number;
  items: number;
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}