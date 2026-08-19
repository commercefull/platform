import * as reportingRepo from '../../infrastructure/repositories/reportingRepo';
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class ListReportSchedulesUseCase {
  async execute(organizationId?: string): Promise<ReportScheduleProps[]> {
    return reportingRepo.listSchedules(organizationId);
  }
}
