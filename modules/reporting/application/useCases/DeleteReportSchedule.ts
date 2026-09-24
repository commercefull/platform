import type { ReportingRepository } from '../../domain/repositories/ReportingRepository';

export class DeleteReportScheduleUseCase {
  constructor(private readonly reportingRepo: ReportingRepository) {}

  async execute(reportScheduleId: string): Promise<boolean> {
    return this.reportingRepo.deleteSchedule(reportScheduleId);
  }
}
