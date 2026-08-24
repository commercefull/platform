jest.mock('../../infrastructure/repositories/ReportingDataRepository', () => ({
  __esModule: true,
  default: {
    schedules: {
      listExecutions: jest.fn().mockResolvedValue([
        { reportExecutionId: 'e1', reportScheduleId: 'rs1', status: 'completed', startedAt: new Date(), completedAt: new Date(), recipientCount: 3, deliveryStatus: {}, createdAt: new Date() },
      ]),
    },
    executions: {},
    templates: {},
  },
}));

import { ListReportExecutionsUseCase } from './ListReportExecutions';
import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const mockRepo = reportingDataRepository as unknown as { schedules: Record<string, jest.Mock> };

describe('ListReportExecutionsUseCase', () => {
  let useCase: ListReportExecutionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListReportExecutionsUseCase();
  });

  it('should list executions for a schedule', async () => {
    const result = await useCase.execute('rs1');
    expect(result).toHaveLength(1);
    expect(result[0].reportExecutionId).toBe('e1');
  });

  it('should pass limit parameter', async () => {
    await useCase.execute('rs1', 10);
    expect(mockRepo.schedules.listExecutions).toHaveBeenCalledWith('rs1', 10);
  });
});
