import { reportingRepository as reportingRepo } from '../wired';
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class GetReportScheduleUseCase {
  async execute(reportScheduleId: string): Promise<ReportScheduleProps | null> {
    return reportingRepo.findScheduleById(reportScheduleId);
  }
}
