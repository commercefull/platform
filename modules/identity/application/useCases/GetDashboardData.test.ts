import { lazyMock } from '../../tests/testUtils';
import { GetDashboardDataUseCase } from './GetDashboardData';
import type { DashboardDataPort } from './GetDashboardData';

describe('GetDashboardDataUseCase', () => {
  let useCase: GetDashboardDataUseCase;
  let dashboardRepo: jest.Mocked<DashboardDataPort>;

  beforeEach(() => {
    jest.resetAllMocks();
    dashboardRepo = lazyMock<DashboardDataPort>();
    useCase = new GetDashboardDataUseCase(dashboardRepo);
  });

  it('should get admin dashboard stats', async () => {
    dashboardRepo.getAdminDashboardStats.mockResolvedValue({
      totalOrders: 100,
      totalRevenue: 5000,
      totalCustomers: 50,
      totalProducts: 200,
      pendingOrders: 5,
      lowStockProducts: 2,
      todayOrders: 10,
      todayRevenue: 500,
    });

    const result = await useCase.getAdminDashboardStats();

    expect(result.totalOrders).toBe(100);
  });

  it('should get recent orders with the requested limit', async () => {
    dashboardRepo.getRecentOrders.mockResolvedValue([
      { orderId: 'o1', orderNumber: 'ORD-1', customerName: 'Cust', totalAmount: 100, status: 'pending', createdAt: new Date() },
    ]);

    const result = await useCase.getRecentOrders(5);

    expect(result).toHaveLength(1);
    expect(dashboardRepo.getRecentOrders).toHaveBeenCalledWith(5);
  });

  it('should get revenue by day', async () => {
    dashboardRepo.getRevenueByDay.mockResolvedValue([{ date: '2024-01-01', revenue: 500, orders: 3 }]);

    const result = await useCase.getRevenueByDay(30);

    expect(result).toHaveLength(1);
    expect(dashboardRepo.getRevenueByDay).toHaveBeenCalledWith(30);
  });
});
