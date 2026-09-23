import '../../tests/testUtils';
import { GetDashboardMetricsUseCase } from './GetDashboardMetrics';
import { createDashboardRepository } from '../../tests/testUtils';

describe('GetDashboardMetricsUseCase', () => {
  const analyticsRepo = createDashboardRepository();
  const useCase = new GetDashboardMetricsUseCase(analyticsRepo);

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsRepo.getOrderMetrics.mockResolvedValue({ count: 100, revenue: 5000 });
    analyticsRepo.getCustomerMetrics.mockResolvedValue({ total: 200, new: 50, conversionRate: 2.5 });
    analyticsRepo.getTopProducts.mockResolvedValue([
      { productId: 'p1', name: 'Widget', quantity: 30, revenue: 900 },
    ]);
    analyticsRepo.getRecentOrders.mockResolvedValue([
      { orderId: 'o1', total: 100, status: 'completed', createdAt: new Date().toISOString() },
    ]);
  });

  it('should aggregate order, customer, product and recent-order metrics', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    expect(result.metrics.totalOrders).toBe(100);
    expect(result.metrics.totalRevenue).toBe(5000);
    expect(result.metrics.averageOrderValue).toBe(50);
    expect(result.metrics.topProducts).toHaveLength(1);
  });

  it('should include previous-period metrics when compareWithPrevious is true', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      compareWithPrevious: true,
    });

    expect(result.metrics.previousPeriod).toBeDefined();
    expect(result.metrics.previousPeriod!.totalOrders).toBe(100);
    expect(analyticsRepo.getOrderMetrics).toHaveBeenCalledTimes(2);
  });

  it('should return a zero average order value when there are no orders', async () => {
    analyticsRepo.getOrderMetrics.mockResolvedValue({ count: 0, revenue: 0 });

    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    expect(result.metrics.averageOrderValue).toBe(0);
  });
});
