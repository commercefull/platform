import { generateReport, ReportParameters } from '../../infrastructure/repositories/reportDataProvider';
import type { ReportData, ReportType } from '../../domain/entities/ReportEntities';

export interface GenerateReportInput {
  reportType: ReportType;
  parameters: ReportParameters;
}

export class GenerateReportUseCase {
  async execute(input: GenerateReportInput): Promise<ReportData> {
    return generateReport(input.reportType, input.parameters);
  }
}
