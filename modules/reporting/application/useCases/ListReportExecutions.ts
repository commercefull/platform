import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const reportingRepo = reportingDataRepository.schedules;
import type { ReportExecutionProps } from '../../domain/entities/ReportEntities';

export class ListReportExecutionsUseCase {
  async execute(reportScheduleId: string, limit?: number): Promise<ReportExecutionProps[]> {
    return reportingRepo.listExecutions(reportScheduleId, limit);
  }
}
