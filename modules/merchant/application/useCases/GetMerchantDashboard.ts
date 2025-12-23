/**
 * GetMerchantDashboard Use Case
 * Retrieves dashboard statistics filtered by merchant
 */

export interface GetMerchantDashboardInput {
  merchantId: string;
}

export interface MerchantDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingPayouts: number;
}

export interface GetMerchantDashboardOutput {
  stats: MerchantDashboardStats;
  recentOrders: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
}

export interface MerchantDashboardRepository {
  getMerchantStats(merchantId: string): Promise<MerchantDashboardStats>;
  getMerchantRecentOrders(merchantId: string, limit: number): Promise<any[]>;
  getMerchantTopProducts(merchantId: string, limit: number): Promise<any[]>;
}

export class GetMerchantDashboardUseCase {
  constructor(private readonly repo: MerchantDashboardRepository) {}

  async execute(input: GetMerchantDashboardInput): Promise<GetMerchantDashboardOutput> {
    if (!input.merchantId) {
      throw new Error('Merchant ID is required');
    }

    const [stats, recentOrders, topProducts] = await Promise.all([
      this.repo.getMerchantStats(input.merchantId),
      this.repo.getMerchantRecentOrders(input.merchantId, 5),
      this.repo.getMerchantTopProducts(input.merchantId, 5),
    ]);

    return {
      stats,
      recentOrders,
      topProducts,
    };
  }
}
