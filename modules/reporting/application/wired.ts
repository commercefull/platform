import reportingDataRepository from '../infrastructure/repositories/ReportingDataRepository';
import type { ReportingRepository, UpdateReportScheduleParams } from '../domain/repositories/ReportingRepository';

const reportingRepository: ReportingRepository = {
  ...reportingDataRepository.schedules,
  generateReport: reportingDataRepository.dataProvider.generateReport,
};

import { CreateReportScheduleUseCase } from './useCases/CreateReportSchedule';
import { DeleteReportScheduleUseCase } from './useCases/DeleteReportSchedule';
import { GenerateReportUseCase } from './useCases/GenerateReport';
import { GetReportScheduleUseCase } from './useCases/GetReportSchedule';
import { ListReportExecutionsUseCase } from './useCases/ListReportExecutions';
import { ListReportSchedulesUseCase } from './useCases/ListReportSchedules';
import { UpdateReportScheduleUseCase } from './useCases/UpdateReportSchedule';

export const createReportScheduleUseCase = new CreateReportScheduleUseCase(reportingRepository);
export const deleteReportScheduleUseCase = new DeleteReportScheduleUseCase(reportingRepository);
export const generateReportUseCase = new GenerateReportUseCase(reportingRepository);
export const getReportScheduleUseCase = new GetReportScheduleUseCase(reportingRepository);
export const listReportExecutionsUseCase = new ListReportExecutionsUseCase(reportingRepository);
export const listReportSchedulesUseCase = new ListReportSchedulesUseCase(reportingRepository);
export const updateReportScheduleUseCase = new UpdateReportScheduleUseCase(reportingRepository);

export { reportingRepository, UpdateReportScheduleParams };
