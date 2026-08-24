import reportingDataRepository from '../../infrastructure/repositories/ReportingDataRepository';

const reportingRepo = reportingDataRepository.schedules;

export class DeleteReportScheduleUseCase {
  async execute(reportScheduleId: string): Promise<boolean> {
    return reportingRepo.deleteSchedule(reportScheduleId);
  }
}
