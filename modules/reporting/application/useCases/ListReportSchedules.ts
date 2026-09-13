import { reportingRepository as reportingRepo } from '../wired';
import type { ReportScheduleProps } from '../../domain/entities/ReportEntities';

export class ListReportSchedulesUseCase {
  async execute(organizationId?: string): Promise<ReportScheduleProps[]> {
    return reportingRepo.listSchedules(organizationId);
  }
}
