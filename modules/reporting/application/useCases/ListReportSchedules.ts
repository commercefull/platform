import type { ReportingRepository } from '../../domain/repositories/ReportingRepository';
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class ListReportSchedulesUseCase {
  constructor(private readonly reportingRepo: ReportingRepository) {}

  async execute(organizationId?: string): Promise<ReportScheduleProps[]> {
    return this.reportingRepo.listSchedules(organizationId);
  }
}
