import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';
import type { ReportParameters } from '../../infrastructure/repositories/ReportingDataRepository';

const { generateReport } = reportingDataRepository.dataProvider;
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
