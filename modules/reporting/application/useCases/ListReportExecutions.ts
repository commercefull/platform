import type { ReportingRepository } from '../../domain/repositories/ReportingRepository';
import type { ReportExecutionProps } from '../../domain/entities/ReportEntities';

export class ListReportExecutionsUseCase {
  constructor(private readonly reportingRepo: ReportingRepository) {}

  async execute(reportScheduleId: string, limit?: number): Promise<ReportExecutionProps[]> {
    return this.reportingRepo.listExecutions(reportScheduleId, limit);
  }
}
