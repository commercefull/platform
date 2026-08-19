export const analyticsTypeDefs = `#graphql
  type DashboardMetrics {
    totalOrders: Int!
    totalRevenue: Float!
    averageOrderValue: Float!
    totalCustomers: Int!
    newCustomers: Int!
    conversionRate: Float!
    topProducts: [AnalyticsTopProduct!]!
    recentOrders: [AnalyticsRecentOrder!]!
    previousPeriod: AnalyticsPreviousPeriod
  }

  type AnalyticsTopProduct {
    productId: String!
    name: String!
    quantity: Int!
    revenue: Float!
  }

  type AnalyticsRecentOrder {
    orderId: String!
    total: Float!
    status: String!
    createdAt: String!
  }

  type AnalyticsPreviousPeriod {
    totalOrders: Int!
    totalRevenue: Float!
    averageOrderValue: Float!
    totalCustomers: Int!
  }

  type DashboardMetricsResult {
    metrics: DashboardMetrics!
    period: AnalyticsPeriod!
  }

  type AnalyticsPeriod {
    start: String!
    end: String!
  }

  type SalesDataPoint {
    date: String!
    orders: Int!
    revenue: Float!
    units: Int!
    averageOrderValue: Float!
  }

  type SalesBreakdown {
    id: String!
    name: String!
    orders: Int!
    revenue: Float!
    percentage: Float!
  }

  type SalesAnalyticsResult {
    timeSeries: [SalesDataPoint!]!
    totals: SalesTotals!
    breakdown: [SalesBreakdown!]
    growth: SalesGrowth!
  }

  type SalesTotals {
    orders: Int!
    revenue: Float!
    units: Int!
    averageOrderValue: Float!
  }

  type SalesGrowth {
    ordersGrowth: Float!
    revenueGrowth: Float!
  }

  type ProductPerformanceItem {
    productId: String!
    name: String!
    sku: String!
    views: Int!
    addToCarts: Int!
    purchases: Int!
    revenue: Float!
    units: Int!
    conversionRate: Float!
    averagePrice: Float!
    returnRate: Float!
  }

  type ProductPerformanceResult {
    products: [ProductPerformanceItem!]!
    summary: ProductPerformanceSummary!
    period: AnalyticsPeriod!
  }

  type ProductPerformanceSummary {
    totalProducts: Int!
    totalViews: Int!
    totalPurchases: Int!
    totalRevenue: Float!
    averageConversionRate: Float!
  }

  type TrackPageViewResult {
    success: Boolean!
    pageViewId: String
    error: String
  }

  type GenerateSalesReportResult {
    success: Boolean!
    report: SalesReport
    error: String
  }

  type SalesReport {
    id: String!
    dateRange: AnalyticsPeriod!
    summary: SalesReportSummary!
    generatedAt: String!
  }

  type SalesReportSummary {
    totalOrders: Int!
    totalRevenue: Float!
    averageOrderValue: Float!
    totalItemsSold: Int!
  }

  input DashboardMetricsInput {
    storeId: String
    startDate: String!
    endDate: String!
    compareWithPrevious: Boolean
  }

  input SalesAnalyticsInput {
    storeId: String
    startDate: String!
    endDate: String!
    groupBy: String!
    breakdown: String
  }

  input ProductPerformanceInput {
    storeId: String
    productId: String
    categoryId: String
    startDate: String!
    endDate: String!
    sortBy: String
    limit: Int
  }

  input TrackPageViewInput {
    sessionId: String!
    customerId: String
    pageUrl: String!
    pageTitle: String
    referrer: String
    userAgent: String
    deviceType: String
  }

  input GenerateSalesReportInput {
    startDate: String!
    endDate: String!
    organizationId: String
    generatedBy: String
  }

  type Query {
    dashboardMetrics(input: DashboardMetricsInput!): DashboardMetricsResult!
    salesAnalytics(input: SalesAnalyticsInput!): SalesAnalyticsResult!
    productPerformance(input: ProductPerformanceInput!): ProductPerformanceResult!
  }

  type Mutation {
    trackPageView(input: TrackPageViewInput!): TrackPageViewResult!
    generateSalesReport(input: GenerateSalesReportInput!): GenerateSalesReportResult!
  }
`;
