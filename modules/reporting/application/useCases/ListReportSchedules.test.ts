import { createReportingRepository, createReportSchedule } from '../../tests/testUtils';
import { ListReportSchedulesUseCase } from './ListReportSchedules';

describe('ListReportSchedulesUseCase', () => {
  let useCase: ListReportSchedulesUseCase;
  let reportingRepo: ReturnType<typeof createReportingRepository>;

  beforeEach(() => {
    reportingRepo = createReportingRepository();
    useCase = new ListReportSchedulesUseCase(reportingRepo);
  });

  it('should return the schedules for the organization', async () => {
    reportingRepo.listSchedules.mockResolvedValue([createReportSchedule()]);

    const result = await useCase.execute('org-1');

    expect(reportingRepo.listSchedules).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
  });

  it('should list all schedules when no organization is given', async () => {
    reportingRepo.listSchedules.mockResolvedValue([createReportSchedule(), createReportSchedule({ reportScheduleId: 's2' })]);

    const result = await useCase.execute();

    expect(reportingRepo.listSchedules).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(2);
  });
});
