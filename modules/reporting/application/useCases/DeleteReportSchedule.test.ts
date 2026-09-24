import { createReportingRepository } from '../../tests/testUtils';
import { DeleteReportScheduleUseCase } from './DeleteReportSchedule';

describe('DeleteReportScheduleUseCase', () => {
  let useCase: DeleteReportScheduleUseCase;
  let reportingRepo: ReturnType<typeof createReportingRepository>;

  beforeEach(() => {
    reportingRepo = createReportingRepository();
    useCase = new DeleteReportScheduleUseCase(reportingRepo);
  });

  it('should return true when the schedule is deleted', async () => {
    reportingRepo.deleteSchedule.mockResolvedValue(true);

    const result = await useCase.execute('sched-1');

    expect(result).toBe(true);
    expect(reportingRepo.deleteSchedule).toHaveBeenCalledWith('sched-1');
  });

  it('should return false when the schedule does not exist', async () => {
    reportingRepo.deleteSchedule.mockResolvedValue(false);

    const result = await useCase.execute('missing');

    expect(result).toBe(false);
  });
});
