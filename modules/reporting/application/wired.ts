import reportingDataRepository from '../infrastructure/repositories/ReportingDataRepository';
import type { ReportingRepository, UpdateReportScheduleParams } from '../domain/repositories/ReportingRepository';

const reportingRepository: ReportingRepository = {
  ...reportingDataRepository.schedules,
  generateReport: reportingDataRepository.dataProvider.generateReport,
};

export { reportingRepository, UpdateReportScheduleParams };
