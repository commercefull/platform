import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const reportingRepo = reportingDataRepository.schedules;
import type { ReportScheduleProps, ReportType, ReportFrequency, ReportFormat } from '../../domain/entities/ReportEntities';

export interface CreateReportScheduleInput {
  organizationId?: string;
  name: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  parameters?: Record<string, unknown>;
  recipients?: string[];
  format?: ReportFormat;
}

export class CreateReportScheduleUseCase {
  async execute(input: CreateReportScheduleInput): Promise<ReportScheduleProps> {
    return reportingRepo.createSchedule(input);
  }
}
