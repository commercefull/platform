import { REPORT_TEMPLATES, type ReportTemplate, type ReportType } from '../../domain/entities/ReportEntities';

export class GetReportTemplatesUseCase {
  async execute(): Promise<Record<ReportType, ReportTemplate>> {
    return REPORT_TEMPLATES;
  }
}
