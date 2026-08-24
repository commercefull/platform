jest.mock('../../infrastructure/repositories/ReportingDataRepository', () => ({
  __esModule: true,
  default: {
    schedules: {
      listSchedules: jest.fn().mockResolvedValue([
        { reportScheduleId: 'rs-1', reportType: 'sales_summary', frequency: 'weekly', organizationId: 'org-1', name: 'Weekly Sales', parameters: {}, recipients: [], format: 'pdf', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ]),
    },
  },
}));

import { ListReportSchedulesUseCase } from './ListReportSchedules';
import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

describe('ListReportSchedulesUseCase', () => {
  let useCase: ListReportSchedulesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListReportSchedulesUseCase();
  });

  it('should list report schedules (happy path)', async () => {
    const result = await useCase.execute('org-1');

    expect(result).toHaveLength(1);
    expect(result[0].reportScheduleId).toBe('rs-1');
    expect(reportingDataRepository.schedules.listSchedules).toHaveBeenCalledWith('org-1');
  });

  it('should list all schedules when no orgId provided', async () => {
    await useCase.execute();

    expect(reportingDataRepository.schedules.listSchedules).toHaveBeenCalledWith(undefined);
  });
});
