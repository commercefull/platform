import type { ReportingRepository } from '../../domain/repositories/ReportingRepository';
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
  constructor(private readonly reportingRepo: ReportingRepository) {}

  async execute(input: UpdateReportScheduleInput): Promise<ReportScheduleProps | null> {
    return this.reportingRepo.updateSchedule(input.reportScheduleId, input);
  }
}
