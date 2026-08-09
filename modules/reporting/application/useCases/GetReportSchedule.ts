import * as reportingRepo from '../../infrastructure/repositories/reportingRepo';
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class GetReportScheduleUseCase {
  async execute(reportScheduleId: string): Promise<ReportScheduleProps | null> {
    return reportingRepo.findScheduleById(reportScheduleId);
  }
}
