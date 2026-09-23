import '../../tests/testUtils';
import { GetAnalyticsDataUseCase } from './GetAnalyticsData';
import {
  createAnalyticsDataPort,
  createSalesSummary,
  createProductPerformance,
  createCustomerCohort,
  createRealTimeMetrics,
} from '../../tests/testUtils';

describe('GetAnalyticsDataUseCase', () => {
  const analyticsDataPort = createAnalyticsDataPort();
  const useCase = new GetAnalyticsDataUseCase(analyticsDataPort);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the sales summary for the given period', async () => {
    analyticsDataPort.getSalesSummary.mockResolvedValue(createSalesSummary());
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    const result = await useCase.getSalesSummary(startDate, endDate);

    expect(result.totalRevenue).toBe(5000);
    expect(analyticsDataPort.getSalesSummary).toHaveBeenCalledWith(startDate, endDate);
  });

  it('should return the top products sorted by the given metric', async () => {
    analyticsDataPort.getTopProducts.mockResolvedValue([createProductPerformance()]);

    const result = await useCase.getTopProducts(new Date('2024-01-01'), new Date('2024-12-31'), 'revenue', 10);

    expect(result).toHaveLength(1);
    expect(analyticsDataPort.getTopProducts).toHaveBeenCalledWith(
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      'revenue',
      10,
    );
  });

  it('should return customer cohorts', async () => {
    analyticsDataPort.getCustomerCohorts.mockResolvedValue([createCustomerCohort()]);

    const result = await useCase.getCustomerCohorts();

    expect(result).toHaveLength(1);
    expect(result[0].customersInCohort).toBe(50);
  });

  it('should return real-time metrics', async () => {
    analyticsDataPort.getRealTimeMetrics.mockResolvedValue(createRealTimeMetrics());

    const result = await useCase.getRealTimeMetrics();

    expect(result.activeUsers).toBe(10);
  });
});
