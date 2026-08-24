import { GetReportTemplatesUseCase } from './GetReportTemplates';

describe('GetReportTemplatesUseCase', () => {
  let useCase: GetReportTemplatesUseCase;

  beforeEach(() => {
    useCase = new GetReportTemplatesUseCase();
  });

  it('should return all report templates', async () => {
    const result = await useCase.execute();
    expect(result).toBeDefined();
    expect(result.sales_summary).toBeDefined();
    expect(result.sales_summary.reportType).toBe('sales_summary');
  });
});
