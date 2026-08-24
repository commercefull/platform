jest.mock('../../infrastructure/repositories/ReportingDataRepository', () => ({
  __esModule: true,
  default: {
    schedules: {
      findScheduleById: jest.fn().mockResolvedValue({
        reportScheduleId: 'rs1', name: 'Weekly Sales', reportType: 'sales_summary',
        frequency: 'weekly', recipients: [], parameters: {}, format: 'pdf',
        isActive: true, createdAt: new Date(), updatedAt: new Date(),
      }),
    },
    executions: {},
    templates: {},
  },
}));

import { GetReportScheduleUseCase } from './GetReportSchedule';
import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const mockRepo = reportingDataRepository as unknown as { schedules: Record<string, jest.Mock> };

describe('GetReportScheduleUseCase', () => {
  let useCase: GetReportScheduleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetReportScheduleUseCase();
  });

  it('should find schedule by ID (happy path)', async () => {
    const result = await useCase.execute('rs1');
    expect(result?.reportScheduleId).toBe('rs1');
    expect(result?.name).toBe('Weekly Sales');
  });

  it('should return null when not found', async () => {
    mockRepo.schedules.findScheduleById.mockResolvedValueOnce(null);

    const result = await useCase.execute('nonexistent');
    expect(result).toBeNull();
  });
});
