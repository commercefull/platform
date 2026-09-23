import type { ReportingRepository, ReportParameters } from '../../domain/repositories/ReportingRepository';
import type { ReportData, ReportType } from '../../domain/entities/ReportEntities';

export interface GenerateReportInput {
  reportType: ReportType;
  parameters: ReportParameters;
}

export class GenerateReportUseCase {
  constructor(private readonly reportingRepo: ReportingRepository) {}

  async execute(input: GenerateReportInput): Promise<ReportData> {
    return this.reportingRepo.generateReport(input.reportType, input.parameters);
  }
}
