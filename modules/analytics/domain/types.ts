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
