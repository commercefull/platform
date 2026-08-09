import * as reportingRepo from '../../infrastructure/repositories/reportingRepo';

export class DeleteReportScheduleUseCase {
  async execute(reportScheduleId: string): Promise<boolean> {
    return reportingRepo.deleteSchedule(reportScheduleId);
  }
}
