import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';
import { GenerateReportUseCase } from '../../../modules/reporting/application/useCases/GenerateReport';
import { GetReportTemplatesUseCase } from '../../../modules/reporting/application/useCases/GetReportTemplates';
import { CreateReportScheduleUseCase } from '../../../modules/reporting/application/useCases/CreateReportSchedule';
import { ListReportSchedulesUseCase } from '../../../modules/reporting/application/useCases/ListReportSchedules';
import { GetReportScheduleUseCase } from '../../../modules/reporting/application/useCases/GetReportSchedule';
import { UpdateReportScheduleUseCase } from '../../../modules/reporting/application/useCases/UpdateReportSchedule';
import { DeleteReportScheduleUseCase } from '../../../modules/reporting/application/useCases/DeleteReportSchedule';
import { ListReportExecutionsUseCase } from '../../../modules/reporting/application/useCases/ListReportExecutions';
import type { ReportType } from '../../../modules/reporting/domain/entities/ReportEntities';

export const reportingDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const templatesUseCase = new GetReportTemplatesUseCase();
    const templates = await templatesUseCase.execute();

    adminRespond(req, res, 'reporting/dashboard', {
      pageName: 'Reporting Dashboard',
      templates,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load reporting dashboard' });
  }
};

export const generateReport = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const useCase = new GenerateReportUseCase();
    const result = await useCase.execute({
      reportType: body.reportType as ReportType,
      parameters: {
        dateFrom: body.dateFrom || undefined,
        dateTo: body.dateTo || undefined,
        storeId: body.storeId || undefined,
        merchantId: body.merchantId || undefined,
        categoryId: body.categoryId || undefined,
        status: body.status || undefined,
        lowStockOnly: body.lowStockOnly === 'true' || undefined,
        limit: body.limit ? parseInt(body.limit, 10) : undefined,
      },
    });

    adminRespond(req, res, 'reporting/report-detail', {
      pageName: 'Report Results',
      report: result,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to generate report' });
  }
};

export const listSchedules = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ListReportSchedulesUseCase();
    const schedules = await useCase.execute();

    adminRespond(req, res, 'reporting/scheduled', {
      pageName: 'Scheduled Reports',
      schedules,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load scheduled reports' });
  }
};

export const viewSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const scheduleUseCase = new GetReportScheduleUseCase();
    const schedule = await scheduleUseCase.execute(req.params.scheduleId);
    if (!schedule) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Report schedule not found' });
      return;
    }

    const executionsUseCase = new ListReportExecutionsUseCase();
    const executions = await executionsUseCase.execute(req.params.scheduleId);

    adminRespond(req, res, 'reporting/schedule-detail', {
      pageName: schedule.name,
      schedule,
      executions,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load schedule' });
  }
};

export const createScheduleForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const templatesUseCase = new GetReportTemplatesUseCase();
    const templates = await templatesUseCase.execute();

    adminRespond(req, res, 'reporting/create-schedule', {
      pageName: 'Create Scheduled Report',
      templates,
      formData: {},
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load form' });
  }
};

export const createSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const useCase = new CreateReportScheduleUseCase();
    const result = await useCase.execute({
      name: body.name,
      reportType: body.reportType as ReportType,
      frequency: (body.frequency || 'daily') as never,
      parameters: body.parameters ? JSON.parse(body.parameters) : {},
      recipients: body.recipients ? body.recipients.split(',').map((r: string) => r.trim()).filter(Boolean) : [],
      format: (body.format || 'pdf') as never,
    });
    res.redirect(`/admin/reporting/schedules/${result.reportScheduleId}?success=Scheduled report created successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    const templatesUseCase = new GetReportTemplatesUseCase();
    const templates = await templatesUseCase.execute().catch(() => ({}));
    adminRespond(req, res, 'reporting/create-schedule', {
      pageName: 'Create Scheduled Report',
      error: (error as Error).message || 'Failed to create schedule',
      templates,
      formData: req.body as RequestBody,
    });
  }
};

export const editScheduleForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const scheduleUseCase = new GetReportScheduleUseCase();
    const schedule = await scheduleUseCase.execute(req.params.scheduleId);
    if (!schedule) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Report schedule not found' });
      return;
    }

    adminRespond(req, res, 'reporting/edit-schedule', {
      pageName: 'Edit Scheduled Report',
      schedule,
      formData: schedule,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load form' });
  }
};

export const updateSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const useCase = new UpdateReportScheduleUseCase();
    await useCase.execute({
      reportScheduleId: req.params.scheduleId,
      name: body.name || undefined,
      frequency: (body.frequency || undefined) as never,
      parameters: body.parameters ? JSON.parse(body.parameters) : undefined,
      recipients: body.recipients ? body.recipients.split(',').map((r: string) => r.trim()).filter(Boolean) : undefined,
      format: (body.format || undefined) as never,
      isActive: body.isActive === 'true',
    });
    res.redirect(`/admin/reporting/schedules/${req.params.scheduleId}?success=Scheduled report updated successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    const scheduleUseCase = new GetReportScheduleUseCase();
    const schedule = await scheduleUseCase.execute(req.params.scheduleId).catch(() => null);
    adminRespond(req, res, 'reporting/edit-schedule', {
      pageName: 'Edit Scheduled Report',
      error: (error as Error).message || 'Failed to update schedule',
      schedule: schedule || { reportScheduleId: req.params.scheduleId },
      formData: req.body as RequestBody,
    });
  }
};

export const deleteSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new DeleteReportScheduleUseCase();
    await useCase.execute(req.params.scheduleId);
    res.redirect('/admin/reporting/schedules?success=Scheduled report deleted successfully');
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.redirect(`/admin/reporting/schedules?error=${encodeURIComponent((error as Error).message || 'Failed to delete schedule')}`);
  }
};
