import { reportingRepository as reportingRepo } from '../wired';

export class DeleteReportScheduleUseCase {
  async execute(reportScheduleId: string): Promise<boolean> {
    return reportingRepo.deleteSchedule(reportScheduleId);
  }
}
