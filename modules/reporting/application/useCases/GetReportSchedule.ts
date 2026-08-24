import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const reportingRepo = reportingDataRepository.schedules;
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class GetReportScheduleUseCase {
  async execute(reportScheduleId: string): Promise<ReportScheduleProps | null> {
    return reportingRepo.findScheduleById(reportScheduleId);
  }
}
