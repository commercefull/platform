jest.mock('../../infrastructure/repositories/ReportingDataRepository', () => ({
  __esModule: true,
  default: {
    schedules: {
      createSchedule: jest.fn().mockResolvedValue({
        reportScheduleId: 'rs1', name: 'Weekly Sales', reportType: 'sales_summary', frequency: 'weekly',
        recipients: ['admin@test.com'], parameters: {}, format: 'pdf', isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      }),
    },
    executions: {},
    templates: {},
  },
}));

import { CreateReportScheduleUseCase } from './CreateReportSchedule';
import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const mockRepo = reportingDataRepository as unknown as { schedules: Record<string, jest.Mock> };

describe('CreateReportScheduleUseCase', () => {
  let useCase: CreateReportScheduleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateReportScheduleUseCase();
  });

  it('should create report schedule (happy path)', async () => {
    const result = await useCase.execute({
      name: 'Weekly Sales', reportType: 'sales_summary', frequency: 'weekly',
      recipients: ['admin@test.com'],
    });

    expect(result.reportScheduleId).toBe('rs1');
    expect(result.name).toBe('Weekly Sales');
    expect(mockRepo.schedules.createSchedule).toHaveBeenCalled();
  });
});
