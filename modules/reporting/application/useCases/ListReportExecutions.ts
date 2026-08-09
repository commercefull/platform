import * as reportingRepo from '../../infrastructure/repositories/reportingRepo';
import type { ReportExecutionProps } from '../../domain/entities/ReportEntities';

export class ListReportExecutionsUseCase {
  async execute(reportScheduleId: string, limit?: number): Promise<ReportExecutionProps[]> {
    return reportingRepo.listExecutions(reportScheduleId, limit);
  }
}
