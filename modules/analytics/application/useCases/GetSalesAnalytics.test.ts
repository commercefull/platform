import { GetSalesAnalyticsUseCase} from './GetSalesAnalytics';

describe('GetSalesAnalyticsUseCase', () => {
  let useCase: GetSalesAnalyticsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getSalesTimeSeries: jest.fn().mockResolvedValue([
        { date: '2024-01-01', orders: 10, revenue: 1000, units: 20, averageOrderValue: 100 },
        { date: '2024-01-02', orders: 15, revenue: 1500, units: 30, averageOrderValue: 100 },
      ]),
      getSalesBreakdown: jest.fn().mockResolvedValue([
        { id: 'cat1', name: 'Electronics', orders: 10, revenue: 1000, percentage: 0 },
      ]),
      getSalesTotals: jest.fn().mockResolvedValue({ orders: 20, revenue: 2000 }),
    };
    useCase = new GetSalesAnalyticsUseCase(mockRepo as never);
  });

  it('should get sales analytics (happy path)', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31'), groupBy: 'day',
    });

    expect(result.timeSeries).toHaveLength(2);
    expect(result.totals.orders).toBe(25);
    expect(result.totals.revenue).toBe(2500);
    expect(result.totals.averageOrderValue).toBe(100);
  });

  it('should include breakdown when requested', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31'), groupBy: 'day', breakdown: 'category',
    });

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown![0].percentage).toBeGreaterThan(0);
  });

  it('should calculate growth rates', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31'), groupBy: 'day',
    });

    expect(result.growth.ordersGrowth).toBeGreaterThan(0);
  });
});
