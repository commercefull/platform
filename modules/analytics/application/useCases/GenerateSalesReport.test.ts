jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));

import { GenerateSalesReportUseCase } from './GenerateSalesReport';
import type { AnalyticsDataPort } from '../../domain/repositories/AnalyticsDataPort';
import { eventBus } from '../../../../libs/events/eventBus';

const mockPort: AnalyticsDataPort = {
  getSalesSummary: jest.fn().mockResolvedValue({
    totalOrders: 100, totalRevenue: 5000, averageOrderValue: 50,
  }),
  getTopProducts: jest.fn(),
  getCustomerCohorts: jest.fn(),
  findRecentCustomerIds: jest.fn(),
  findCustomerPurchaseHistory: jest.fn(),
  findRecentCustomerId: jest.fn(),
  getRevenueData: jest.fn(),
  getCustomerData: jest.fn(),
  getInventoryData: jest.fn(),
  getRealTimeMetrics: jest.fn(),
};

describe('GenerateSalesReportUseCase', () => {
  let useCase: GenerateSalesReportUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GenerateSalesReportUseCase(mockPort);
  });

  it('should generate sales report (happy path)', async () => {
    const result = await useCase.execute({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.success).toBe(true);
    expect(result.report?.summary.totalOrders).toBe(100);
    expect(result.report?.summary.totalRevenue).toBe(5000);
  });

  it('should return error when start date >= end date', async () => {
    const result = await useCase.execute({
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-01-01'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Start date must be before');
  });

  it('should handle errors from analytics repo', async () => {
    (mockPort.getSalesSummary as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

    const result = await useCase.execute({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });

  it('should emit event on successful report generation', async () => {
    const result = await useCase.execute({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      generatedBy: 'admin1',
    });

    expect(result.success).toBe(true);
    expect(eventBus.emit).toHaveBeenCalledWith('analytics.report.generated', expect.objectContaining({
      generatedBy: 'admin1',
    }));
  });
});
