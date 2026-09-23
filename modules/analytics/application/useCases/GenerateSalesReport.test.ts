import '../../tests/testUtils';
import { GenerateSalesReportUseCase } from './GenerateSalesReport';
import { createAnalyticsDataPort, createSalesSummary, emitMock } from '../../tests/testUtils';

describe('GenerateSalesReportUseCase', () => {
  const analyticsDataPort = createAnalyticsDataPort();
  const useCase = new GenerateSalesReportUseCase(analyticsDataPort);

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsDataPort.getSalesSummary.mockResolvedValue(createSalesSummary());
  });

  it('should generate a sales report with summary metrics', async () => {
    const result = await useCase.execute({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.success).toBe(true);
    expect(result.report?.summary.totalOrders).toBe(100);
    expect(result.report?.summary.totalRevenue).toBe(5000);
  });

  it('should fail when the start date is not before the end date', async () => {
    const result = await useCase.execute({
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-01-01'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Start date must be before');
    expect(analyticsDataPort.getSalesSummary).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should return the repository error when the summary query fails', async () => {
    analyticsDataPort.getSalesSummary.mockRejectedValueOnce(new Error('DB error'));

    const result = await useCase.execute({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should emit analytics.report.generated when the report is generated', async () => {
    const result = await useCase.execute({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      generatedBy: 'admin1',
    });

    expect(result.success).toBe(true);
    expect(emitMock).toHaveBeenCalledWith(
      'analytics.report.generated',
      expect.objectContaining({ generatedBy: 'admin1' }),
    );
  });
});
