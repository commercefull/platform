import { createReportingRepository, createReportSchedule } from '../../tests/testUtils';
import { UpdateReportScheduleUseCase } from './UpdateReportSchedule';

describe('UpdateReportScheduleUseCase', () => {
  let useCase: UpdateReportScheduleUseCase;
  let reportingRepo: ReturnType<typeof createReportingRepository>;

  beforeEach(() => {
    reportingRepo = createReportingRepository();
    useCase = new UpdateReportScheduleUseCase(reportingRepo);
  });

  it('should update and return the schedule when it exists', async () => {
    const updated = createReportSchedule({ frequency: 'weekly' });
    reportingRepo.updateSchedule.mockResolvedValue(updated);

    const input = { reportScheduleId: 'sched-1', frequency: 'weekly' as const };
    const result = await useCase.execute(input);

    expect(result?.frequency).toBe('weekly');
    expect(reportingRepo.updateSchedule).toHaveBeenCalledWith('sched-1', input);
  });

  it('should return null when the schedule does not exist', async () => {
    reportingRepo.updateSchedule.mockResolvedValue(null);

    const result = await useCase.execute({ reportScheduleId: 'missing', name: 'X' });

    expect(result).toBeNull();
  });
});
