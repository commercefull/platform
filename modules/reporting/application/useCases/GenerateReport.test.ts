import { createReportingRepository, createReportData } from '../../tests/testUtils';
import { GenerateReportUseCase } from './GenerateReport';

describe('GenerateReportUseCase', () => {
  let useCase: GenerateReportUseCase;
  let reportingRepo: ReturnType<typeof createReportingRepository>;

  beforeEach(() => {
    reportingRepo = createReportingRepository();
    useCase = new GenerateReportUseCase(reportingRepo);
  });

  it('should generate the report with the given type and parameters', async () => {
    const data = createReportData();
    reportingRepo.generateReport.mockResolvedValue(data);

    const parameters = { dateFrom: '2024-01-01', dateTo: '2024-01-31' };
    const result = await useCase.execute({ reportType: 'sales_summary', parameters });

    expect(result).toBe(data);
    expect(reportingRepo.generateReport).toHaveBeenCalledWith('sales_summary', parameters);
  });
});
