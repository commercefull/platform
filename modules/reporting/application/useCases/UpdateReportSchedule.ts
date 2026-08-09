import * as reportingRepo from '../../infrastructure/repositories/reportingRepo';
import type { ReportScheduleProps, ReportFrequency, ReportFormat } from '../../domain/entities/ReportEntities';

export interface UpdateReportScheduleInput {
  reportScheduleId: string;
  name?: string;
  frequency?: ReportFrequency;
  parameters?: Record<string, unknown>;
  recipients?: string[];
  format?: ReportFormat;
  isActive?: boolean;
}

export class UpdateReportScheduleUseCase {
  async execute(input: UpdateReportScheduleInput): Promise<ReportScheduleProps | null> {
    return reportingRepo.updateSchedule(input.reportScheduleId, input);
  }
}
