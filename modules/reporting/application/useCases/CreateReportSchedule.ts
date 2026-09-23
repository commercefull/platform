import type { ReportingRepository } from '../../domain/repositories/ReportingRepository';
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
  constructor(private readonly reportingRepo: ReportingRepository) {}

  async execute(input: CreateReportScheduleInput): Promise<ReportScheduleProps> {
    return this.reportingRepo.createSchedule(input);
  }
}
