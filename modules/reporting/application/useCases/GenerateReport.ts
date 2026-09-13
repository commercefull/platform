import { reportingRepository } from '../wired';
import type { ReportParameters } from '../../domain/repositories/ReportingRepository';

const { generateReport } = reportingRepository;
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
