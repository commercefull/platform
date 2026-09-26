export interface ProductPerformance {
  analyticsProductPerformanceId: string;
  productId: string;
  productVariantId?: string;
  date: Date;
  channel: string;
  views: number;
  uniqueViews: number;
  detailViews: number;
  addToCarts: number;
  removeFromCarts: number;
  viewToCartRate: number;
  purchases: number;
  quantitySold: number;
  revenueCents: number;
  averagePriceCents: number;
  cartToOrderRate: number;
  returns: number;
  returnQuantity: number;
  returnRate: number;
  reviews: number;
  averageRating?: number;
  stockAlerts: number;
  outOfStockViews: number;
  computedAt?: Date;
  createdAt: Date;
}

export interface CustomerCohort {
  analyticsCustomerCohortId: string;
  organizationId?: string;
  cohortMonth: Date;
  monthNumber: number;
  customersInCohort: number;
  activeCustomers: number;
  retentionRate: number;
  revenueCents: number;
  orders: number;
  averageOrderValueCents: number;
  lifetimeValueCents: number;
  repeatPurchasers: number;
  repeatPurchaseRate: number;
  averageOrdersPerCustomer: number;
  computedAt?: Date;
  createdAt: Date;
}

export interface AnalyticsReportEvent {
  analyticsReportEventId: string;
  organizationId?: string;
  eventType: string;
  eventCategory: string;
  eventAction: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  basketId?: string;
  sessionId?: string;
  visitorId?: string;
  channel?: string;
  eventData?: Record<string, unknown>;
  eventValueCents?: number;
  eventQuantity?: number;
  currency?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  country?: string;
  region?: string;
  isProcessed: boolean;
  processedAt?: Date;
  createdAt: Date;
}

export interface AnalyticsReportSnapshot {
  analyticsReportSnapshotId: string;
  organizationId?: string;
  snapshotType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  snapshotTime: Date;
  snapshotDate: Date;
  snapshotHour?: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenueCents: number;
  pendingRevenueCents: number;
  refundedAmountCents: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomersToday: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalInventoryValueCents: number;
  totalInventoryUnits: number;
  openTickets: number;
  pendingTickets: number;
  activeSubscriptions: number;
  monthlyRecurringRevenueCents: number;
  createdAt: Date;
}

export interface AnalyticsReportDashboard {
  analyticsReportDashboardId: string;
  organizationId?: string;
  createdBy?: string;
  name: string;
  slug?: string;
  description?: string;
  isDefault: boolean;
  isShared: boolean;
  layout?: Record<string, unknown>;
  widgets?: unknown[];
  filters?: Record<string, unknown>;
  dateRange: string;
  createdAt: Date;
  updatedAt: Date;
}
