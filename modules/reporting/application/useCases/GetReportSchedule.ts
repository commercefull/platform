import type { ReportingRepository } from '../../domain/repositories/ReportingRepository';
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class GetReportScheduleUseCase {
  constructor(private readonly reportingRepo: ReportingRepository) {}

  async execute(reportScheduleId: string): Promise<ReportScheduleProps | null> {
    return this.reportingRepo.findScheduleById(reportScheduleId);
  }
}
