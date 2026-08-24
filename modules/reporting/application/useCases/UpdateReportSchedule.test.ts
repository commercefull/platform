jest.mock('../../infrastructure/repositories/ReportingDataRepository', () => ({
  __esModule: true,
  default: {
    schedules: {
      updateSchedule: jest.fn().mockResolvedValue({
        reportScheduleId: 'rs1', name: 'Updated', reportType: 'sales_summary',
        frequency: 'monthly', recipients: ['a@b.com'], parameters: {}, format: 'csv',
        isActive: true, createdAt: new Date(), updatedAt: new Date(),
      }),
    },
    executions: {},
    templates: {},
  },
}));

import { UpdateReportScheduleUseCase } from './UpdateReportSchedule';

describe('UpdateReportScheduleUseCase', () => {
  let useCase: UpdateReportScheduleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateReportScheduleUseCase();
  });

  it('should update schedule (happy path)', async () => {
    const result = await useCase.execute({
      reportScheduleId: 'rs1', name: 'Updated', frequency: 'monthly',
    });

    expect(result?.reportScheduleId).toBe('rs1');
    expect(result?.name).toBe('Updated');
    expect(result?.frequency).toBe('monthly');
  });
});
