import { ManageReportSchedulesUseCase } from './ManageReportSchedules';

describe('ManageReportSchedulesUseCase', () => {
  let useCase: ManageReportSchedulesUseCase;

  beforeEach(() => {
    useCase = new ManageReportSchedulesUseCase();
  });

  it('should get scheduled reports', async () => {
    const result = await useCase.getScheduledReports();
    expect(result).toEqual([]);
  });

  it('should get execution history', async () => {
    const result = await useCase.getReportExecutionHistory();
    expect(result).toEqual([]);
  });

  it('should schedule report', async () => {
    const result = await useCase.scheduleReport({
      reportType: 'sales',
      schedule: 'daily',
      recipients: [],
      parameters: {},
      isActive: true,
    } as never);

    expect(result.reportScheduleId).toBe('placeholder-id');
    expect(result.reportType).toBe('sales');
  });

  it('should execute scheduled report', async () => {
    const result = await useCase.executeScheduledReport('sched-1');

    expect(result.reportScheduleId).toBe('sched-1');
    expect(result.status).toBe('completed');
  });
});
