import '../../tests/testUtils';
import { GetSalesAnalyticsUseCase } from './GetSalesAnalytics';
import { createSalesAnalyticsRepository } from '../../tests/testUtils';

describe('GetSalesAnalyticsUseCase', () => {
  const analyticsRepo = createSalesAnalyticsRepository();
  const useCase = new GetSalesAnalyticsUseCase(analyticsRepo);

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsRepo.getSalesTimeSeries.mockResolvedValue([
      { date: '2024-01-01', orders: 10, revenue: 1000, units: 20, averageOrderValue: 100 },
      { date: '2024-01-02', orders: 15, revenue: 1500, units: 30, averageOrderValue: 100 },
    ]);
    analyticsRepo.getSalesBreakdown.mockResolvedValue([
      { id: 'cat1', name: 'Electronics', orders: 10, revenue: 1000, percentage: 0 },
    ]);
    analyticsRepo.getSalesTotals.mockResolvedValue({ orders: 20, revenue: 2000 });
  });

  it('should aggregate time series totals across the period', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'day',
    });

    expect(result.timeSeries).toHaveLength(2);
    expect(result.totals.orders).toBe(25);
    expect(result.totals.revenue).toBe(2500);
    expect(result.totals.averageOrderValue).toBe(100);
  });

  it('should include a breakdown with percentages when requested', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'day',
      breakdown: 'category',
    });

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown![0].percentage).toBeGreaterThan(0);
    expect(analyticsRepo.getSalesBreakdown).toHaveBeenCalled();
  });

  it('should calculate growth rates between periods', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'day',
    });

    expect(result.growth.ordersGrowth).toBeGreaterThan(0);
  });
});
