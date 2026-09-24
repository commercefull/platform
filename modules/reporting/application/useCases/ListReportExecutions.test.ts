import { createReportingRepository, createReportExecution } from '../../tests/testUtils';
import { ListReportExecutionsUseCase } from './ListReportExecutions';

describe('ListReportExecutionsUseCase', () => {
  let useCase: ListReportExecutionsUseCase;
  let reportingRepo: ReturnType<typeof createReportingRepository>;

  beforeEach(() => {
    reportingRepo = createReportingRepository();
    useCase = new ListReportExecutionsUseCase(reportingRepo);
  });

  it('should return the executions for the schedule', async () => {
    reportingRepo.listExecutions.mockResolvedValue([createReportExecution()]);

    const result = await useCase.execute('sched-1');

    expect(reportingRepo.listExecutions).toHaveBeenCalledWith('sched-1', undefined);
    expect(result).toHaveLength(1);
  });

  it('should pass the limit to the repository', async () => {
    reportingRepo.listExecutions.mockResolvedValue([]);

    await useCase.execute('sched-1', 5);

    expect(reportingRepo.listExecutions).toHaveBeenCalledWith('sched-1', 5);
  });
});
