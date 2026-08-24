jest.mock('../../infrastructure/repositories/ReportingDataRepository', () => ({
  __esModule: true,
  default: {
    schedules: {
      deleteSchedule: jest.fn().mockResolvedValue(true),
    },
    executions: {},
    templates: {},
  },
}));

import { DeleteReportScheduleUseCase } from './DeleteReportSchedule';

describe('DeleteReportScheduleUseCase', () => {
  let useCase: DeleteReportScheduleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeleteReportScheduleUseCase();
  });

  it('should delete schedule (happy path)', async () => {
    const result = await useCase.execute('rs1');
    expect(result).toBe(true);
  });
});
