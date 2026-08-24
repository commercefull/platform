import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const reportingRepo = reportingDataRepository.schedules;
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class ListReportSchedulesUseCase {
  async execute(organizationId?: string): Promise<ReportScheduleProps[]> {
    return reportingRepo.listSchedules(organizationId);
  }
}
