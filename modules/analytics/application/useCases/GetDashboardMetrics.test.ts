import { GetDashboardMetricsUseCase} from './GetDashboardMetrics';

describe('GetDashboardMetricsUseCase', () => {
  let useCase: GetDashboardMetricsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getOrderMetrics: jest.fn().mockResolvedValue({ count: 100, revenue: 5000 }),
      getCustomerMetrics: jest.fn().mockResolvedValue({ total: 200, new: 50, conversionRate: 2.5 }),
      getTopProducts: jest.fn().mockResolvedValue([
        { productId: 'p1', name: 'Widget', quantity: 30, revenue: 900 },
      ]),
      getRecentOrders: jest.fn().mockResolvedValue([
        { orderId: 'o1', total: 100, status: 'completed', createdAt: new Date().toISOString() },
      ]),
    };
    useCase = new GetDashboardMetricsUseCase(mockRepo as never);
  });

  it('should get dashboard metrics (happy path)', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'),
    });

    expect(result.metrics.totalOrders).toBe(100);
    expect(result.metrics.totalRevenue).toBe(5000);
    expect(result.metrics.averageOrderValue).toBe(50);
    expect(result.metrics.topProducts).toHaveLength(1);
  });

  it('should include previous period when compareWithPrevious is true', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), compareWithPrevious: true,
    });

    expect(result.metrics.previousPeriod).toBeDefined();
    expect(result.metrics.previousPeriod!.totalOrders).toBe(100);
  });

  it('should return 0 averageOrderValue when no orders', async () => {
    mockRepo.getOrderMetrics.mockResolvedValue({ count: 0, revenue: 0 });

    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'),
    });

    expect(result.metrics.averageOrderValue).toBe(0);
  });
});
