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
  revenue: number;
  averagePrice: number;
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
  revenue: number;
  orders: number;
  averageOrderValue: number;
  lifetimeValue: number;
  repeatPurchasers: number;
  repeatPurchaseRate: number;
  averageOrdersPerCustomer: number;
  computedAt?: Date;
  createdAt: Date;
}
