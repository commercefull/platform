export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface RecentOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

export interface TopProduct {
  productId: string;
  name: string;
  totalSold: number;
  revenue: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardDataPort {
  getAdminDashboardStats(): Promise<DashboardStats>;
  getRecentOrders(limit: number): Promise<RecentOrder[]>;
  getTopProducts(limit: number): Promise<TopProduct[]>;
  getRevenueByDay(days: number): Promise<RevenueByDay[]>;
}

export class GetDashboardDataUseCase {
  constructor(private readonly dashboardRepo: DashboardDataPort) {}

  async getAdminDashboardStats() {
    return this.dashboardRepo.getAdminDashboardStats();
  }
  async getRecentOrders(limit: number) {
    return this.dashboardRepo.getRecentOrders(limit);
  }
  async getTopProducts(limit: number) {
    return this.dashboardRepo.getTopProducts(limit);
  }
  async getRevenueByDay(days: number) {
    return this.dashboardRepo.getRevenueByDay(days);
  }
}
