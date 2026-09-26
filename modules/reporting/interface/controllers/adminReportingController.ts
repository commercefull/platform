import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { adminRespond } from '../../../../libs/adminRespond';

import {
  generateReportUseCase,
  createReportScheduleUseCase,
  listReportSchedulesUseCase,
  getReportScheduleUseCase,
  updateReportScheduleUseCase,
  deleteReportScheduleUseCase,
  listReportExecutionsUseCase,
  getReportTemplatesUseCase,
} from '../../application/wired';
import type { ReportType } from '../../domain/entities/ReportEntities';

export const reportingDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const templates = await getReportTemplatesUseCase.execute();

  adminRespond(req, res, 'reporting/dashboard', {
    pageName: 'Reporting Dashboard',
    templates,
  });
};

export const generateReport = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const useCase = generateReportUseCase;
  const result = await useCase.execute({
    reportType: body.reportType as ReportType,
    parameters: {
      dateFrom: (body.dateFrom as string) || undefined,
      dateTo: (body.dateTo as string) || undefined,
      storeId: (body.storeId as string) || undefined,
      organizationId: (body.organizationId as string) || undefined,
      categoryId: (body.categoryId as string) || undefined,
      status: (body.status as string) || undefined,
      lowStockOnly: body.lowStockOnly === 'true' || undefined,
      limit: body.limit ? parseInt(body.limit as string, 10) : undefined,
    },
  });

  adminRespond(req, res, 'reporting/report-detail', {
    pageName: 'Report Results',
    report: result,
  });
};

export const listSchedules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = listReportSchedulesUseCase;
  const schedules = await useCase.execute();

  adminRespond(req, res, 'reporting/scheduled', {
    pageName: 'Scheduled Reports',
    schedules,
  });
};

export const viewSchedule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const scheduleUseCase = getReportScheduleUseCase;
  const schedule = await scheduleUseCase.execute(req.params.scheduleId);
  if (!schedule) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Report schedule not found' });
    return;
  }

  const executionsUseCase = listReportExecutionsUseCase;
  const executions = await executionsUseCase.execute(req.params.scheduleId);

  adminRespond(req, res, 'reporting/schedule-detail', {
    pageName: schedule.name,
    schedule,
    executions,
  });
};

export const createScheduleForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const templates = await getReportTemplatesUseCase.execute();

  adminRespond(req, res, 'reporting/create-schedule', {
    pageName: 'Create Scheduled Report',
    templates,
    formData: {},
  });
};

export const createSchedule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const useCase = createReportScheduleUseCase;
    const result = await useCase.execute({
      name: body.name as string,
      reportType: body.reportType as ReportType,
      frequency: (body.frequency || 'daily') as never,
      parameters: body.parameters ? JSON.parse(body.parameters as string) : {},
      recipients: body.recipients
        ? (body.recipients as string)
            .split(',')
            .map((r: string) => r.trim())
            .filter(Boolean)
        : [],
      format: (body.format || 'pdf') as never,
    });
    res.redirect(`/admin/reporting/schedules/${result.reportScheduleId}?success=Scheduled report created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
      const templates = await getReportTemplatesUseCase.execute().catch(() => ({}));
    adminRespond(req, res, 'reporting/create-schedule', {
      pageName: 'Create Scheduled Report',
      error: (error as Error).message || 'Failed to create schedule',
      templates,
      formData: req.body as HttpRequestBody,
    });
  }
};

export const editScheduleForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const scheduleUseCase = getReportScheduleUseCase;
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
};

export const updateSchedule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const useCase = updateReportScheduleUseCase;
    await useCase.execute({
      reportScheduleId: req.params.scheduleId,
      name: (body.name as string) || undefined,
      frequency: (body.frequency || undefined) as never,
      parameters: body.parameters ? JSON.parse(body.parameters as string) : undefined,
      recipients: body.recipients
        ? (body.recipients as string)
            .split(',')
            .map((r: string) => r.trim())
            .filter(Boolean)
        : undefined,
      format: (body.format || undefined) as never,
      isActive: body.isActive === 'true',
    });
    res.redirect(`/admin/reporting/schedules/${req.params.scheduleId}?success=Scheduled report updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    const scheduleUseCase = getReportScheduleUseCase;
    const schedule = await scheduleUseCase.execute(req.params.scheduleId).catch(() => null);
    adminRespond(req, res, 'reporting/edit-schedule', {
      pageName: 'Edit Scheduled Report',
      error: (error as Error).message || 'Failed to update schedule',
      schedule: schedule || { reportScheduleId: req.params.scheduleId },
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deleteSchedule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const useCase = deleteReportScheduleUseCase;
    await useCase.execute(req.params.scheduleId);
    res.redirect('/admin/reporting/schedules?success=Scheduled report deleted successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/reporting/schedules?error=${encodeURIComponent((error as Error).message || 'Failed to delete schedule')}`);
  }
};
