jest.mock('../../infrastructure/repositories/ReportingDataRepository', () => ({
  __esModule: true,
  default: {
    dataProvider: {
      generateReport: jest.fn().mockResolvedValue({ reportType: 'sales_summary', data: [], generatedAt: new Date(), dateRange: { from: new Date(), to: new Date() }, summary: {}, rows: [] }),
    },
    schedules: {
      listSchedules: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { GenerateReportUseCase} from './GenerateReport';
import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

describe('GenerateReportUseCase', () => {
  let useCase: GenerateReportUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GenerateReportUseCase();
  });

  it('should generate report (happy path)', async () => {
    const result = await useCase.execute({ reportType: 'sales_summary', parameters: { dateFrom: '2024-01-01', dateTo: '2024-12-31' } });

    expect(result.reportType).toBe('sales_summary');
    expect(reportingDataRepository.dataProvider.generateReport).toHaveBeenCalledWith('sales_summary', { dateFrom: '2024-01-01', dateTo: '2024-12-31' });
  });
});
