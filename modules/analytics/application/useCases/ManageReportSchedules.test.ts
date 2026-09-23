import { ManageReportSchedulesUseCase } from './ManageReportSchedules';

describe('ManageReportSchedulesUseCase', () => {
  const useCase = new ManageReportSchedulesUseCase();

  it('should return an empty list when there are no scheduled reports', async () => {
    const result = await useCase.getScheduledReports();

    expect(result).toEqual([]);
  });

  it('should return an empty execution history', async () => {
    const result = await useCase.getReportExecutionHistory();

    expect(result).toEqual([]);
  });

  it('should return a schedule with generated id and timestamps when a report is scheduled', async () => {
    const result = await useCase.scheduleReport({
      name: 'Daily Sales',
      type: 'daily',
      reportType: 'sales',
      recipients: [],
      format: 'pdf',
      parameters: {},
      isActive: true,
      nextRunAt: new Date(),
    });

    expect(result.reportScheduleId).toBe('placeholder-id');
    expect(result.reportType).toBe('sales');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should return a completed execution for the given schedule id', async () => {
    const result = await useCase.executeScheduledReport('sched-1');

    expect(result.reportScheduleId).toBe('sched-1');
    expect(result.status).toBe('completed');
    expect(result.completedAt).toBeInstanceOf(Date);
  });
});
