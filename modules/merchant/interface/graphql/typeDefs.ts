export const merchantTypeDefs = `#graphql
  type MerchantDashboardStats {
    totalOrders: Int!
    totalRevenue: Float!
    pendingOrders: Int!
    todayOrders: Int!
    todayRevenue: Float!
    totalProducts: Int!
    lowStockProducts: Int!
    pendingPayouts: Float!
  }

  type MerchantRecentOrder {
    orderId: String!
    orderNumber: String!
    customerName: String!
    totalAmount: Float!
    status: String!
    createdAt: String!
  }

  type MerchantTopProduct {
    productId: String!
    name: String!
    totalSold: Int!
    revenue: Float!
  }

  type MerchantDashboard {
    stats: MerchantDashboardStats!
    recentOrders: [MerchantRecentOrder!]!
    topProducts: [MerchantTopProduct!]!
  }

  type CreateMerchantResult {
    merchantId: String!
    name: String!
    status: String!
    createdAt: String!
  }

  type ApproveMerchantResult {
    merchantId: String!
    status: String!
    approvedAt: String!
  }

  type SuspendMerchantResult {
    merchantId: String!
    status: String!
    suspendedAt: String!
  }

  input CreateMerchantInput {
    name: String!
    email: String!
    phone: String
    businessType: String!
    taxId: String
    website: String
    description: String
    logo: String
    commissionRate: Float
  }

  type Query {
    merchantDashboard(merchantId: String!): MerchantDashboard!
  }

  type Mutation {
    createMerchant(input: CreateMerchantInput!): CreateMerchantResult!
    approveMerchant(merchantId: String!, approvedBy: String!, notes: String): ApproveMerchantResult!
    suspendMerchant(merchantId: String!, reason: String!, suspendedBy: String!): SuspendMerchantResult!
  }
`;
