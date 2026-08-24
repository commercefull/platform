jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { GetAnalyticsDataUseCase } from './GetAnalyticsData';
import type { AnalyticsDataPort } from '../../domain/repositories/AnalyticsDataPort';

const mockPort: AnalyticsDataPort = {
  getSalesSummary: jest.fn().mockResolvedValue({ totalRevenue: 5000, totalOrders: 100 }),
  getTopProducts: jest.fn().mockResolvedValue([{ productId: 'p1', revenue: 1000 }]),
  getCustomerCohorts: jest.fn().mockResolvedValue([{ cohort: '2024-01', count: 50 }]),
  findRecentCustomerIds: jest.fn().mockResolvedValue(['c1', 'c2']),
  findCustomerPurchaseHistory: jest.fn().mockResolvedValue([{ orderId: 'o1' }]),
  findRecentCustomerId: jest.fn().mockResolvedValue('c1'),
  getRevenueData: jest.fn().mockResolvedValue({ revenue: 5000 }),
  getCustomerData: jest.fn().mockResolvedValue({ total: 200 }),
  getInventoryData: jest.fn().mockResolvedValue({ lowStock: 5 }),
  getRealTimeMetrics: jest.fn().mockResolvedValue({ activeUsers: 10 }),
};

describe('GetAnalyticsDataUseCase', () => {
  let useCase: GetAnalyticsDataUseCase;

  beforeEach(() => {
    useCase = new GetAnalyticsDataUseCase(mockPort);
  });

  it('should get sales summary', async () => {
    const result = await useCase.getSalesSummary(new Date('2024-01-01'), new Date('2024-12-31'));

    expect(result.totalRevenue).toBe(5000);
  });

  it('should get top products', async () => {
    const result = await useCase.getTopProducts(new Date('2024-01-01'), new Date('2024-12-31'), 'revenue', 10);

    expect(result).toHaveLength(1);
  });

  it('should get customer cohorts', async () => {
    const result = await useCase.getCustomerCohorts();

    expect(result).toHaveLength(1);
  });

  it('should get real-time metrics', async () => {
    const result = await useCase.getRealTimeMetrics();

    expect(result.activeUsers).toBe(10);
  });
});
