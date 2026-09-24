import { createReportingRepository, createReportSchedule } from '../../tests/testUtils';
import { CreateReportScheduleUseCase } from './CreateReportSchedule';

describe('CreateReportScheduleUseCase', () => {
  let useCase: CreateReportScheduleUseCase;
  let reportingRepo: ReturnType<typeof createReportingRepository>;

  beforeEach(() => {
    reportingRepo = createReportingRepository();
    useCase = new CreateReportScheduleUseCase(reportingRepo);
  });

  it('should create and return the schedule when the input is valid', async () => {
    const saved = createReportSchedule();
    reportingRepo.createSchedule.mockResolvedValue(saved);

    const input = {
      name: 'Daily Sales',
      reportType: 'sales_summary' as const,
      frequency: 'daily' as const,
      recipients: ['ops@example.com'],
      format: 'pdf' as const,
    };
    const result = await useCase.execute(input);

    expect(result).toBe(saved);
    expect(reportingRepo.createSchedule).toHaveBeenCalledWith(input);
  });
});
