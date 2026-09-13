import { reportingRepository as reportingRepo } from '../wired';
import type { ReportExecutionProps } from '../../domain/entities/ReportEntities';

export class ListReportExecutionsUseCase {
  async execute(reportScheduleId: string, limit?: number): Promise<ReportExecutionProps[]> {
    return reportingRepo.listExecutions(reportScheduleId, limit);
  }
}
