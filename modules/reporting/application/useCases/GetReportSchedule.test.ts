import { createReportingRepository, createReportSchedule } from '../../tests/testUtils';
import { GetReportScheduleUseCase } from './GetReportSchedule';

describe('GetReportScheduleUseCase', () => {
  let useCase: GetReportScheduleUseCase;
  let reportingRepo: ReturnType<typeof createReportingRepository>;

  beforeEach(() => {
    reportingRepo = createReportingRepository();
    useCase = new GetReportScheduleUseCase(reportingRepo);
  });

  it('should return the schedule when it exists', async () => {
    reportingRepo.findScheduleById.mockResolvedValue(createReportSchedule());

    const result = await useCase.execute('sched-1');

    expect(result?.name).toBe('Daily Sales');
    expect(reportingRepo.findScheduleById).toHaveBeenCalledWith('sched-1');
  });

  it('should return null when the schedule does not exist', async () => {
    reportingRepo.findScheduleById.mockResolvedValue(null);

    const result = await useCase.execute('missing');

    expect(result).toBeNull();
  });
});
