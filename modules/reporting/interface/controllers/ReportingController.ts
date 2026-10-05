import { jsonResponse } from 'libs/apiResponse';
/**
 * Reporting Controller
 */

import type { HttpRequest, HttpResponse } from 'libs/http';

import type { ReportType } from '../../domain/entities/ReportEntities';
import type { CreateReportScheduleInput } from '../../application/useCases/CreateReportSchedule';

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
import { UpdateReportScheduleParams } from '../../application/wired';

interface GenerateReportBody {
  reportType: ReportType;
  parameters?: Record<string, unknown>;
}

export const generateReport = async (
  req: HttpRequest<Record<string, string>, unknown, GenerateReportBody>,
  res: HttpResponse,
): Promise<void> => {
  if (!req.body.reportType) {
    jsonResponse(res, 400, { success: false, error: 'reportType is required' });
    return;
  }
  const useCase = generateReportUseCase;
  const result = await useCase.execute({
    reportType: req.body.reportType as ReportType,
    parameters: req.body.parameters || {},
  });
  jsonResponse(res, 200, { success: true, data: result });
};

export const getReportTemplates = async (_req: HttpRequest, res: HttpResponse): Promise<void> => {
  const templates = await getReportTemplatesUseCase.execute();
  const templateList = Object.values(templates);
  jsonResponse(res, 200, { success: true, data: templateList });
};

export const createSchedule = async (
  req: HttpRequest<Record<string, string>, unknown, CreateReportScheduleInput>,
  res: HttpResponse,
): Promise<void> => {
  if (!req.body.name || !req.body.reportType) {
    jsonResponse(res, 400, { success: false, error: 'name and reportType are required' });
    return;
  }
  const useCase = createReportScheduleUseCase;
  const result = await useCase.execute(req.body);
  jsonResponse(res, 201, { success: true, data: result });
};

export const listSchedules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = listReportSchedulesUseCase;
  const organizationId = req.query.organizationId as string | undefined;
  const result = await useCase.execute(organizationId);
  jsonResponse(res, 200, { success: true, data: result });
};

export const getSchedule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = getReportScheduleUseCase;
  const result = await useCase.execute(req.params.scheduleId);
  if (!result) {
    jsonResponse(res, 404, { success: false, error: 'Report schedule not found' });
    return;
  }
  jsonResponse(res, 200, { success: true, data: result });
};

export const updateSchedule = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateReportScheduleParams>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = updateReportScheduleUseCase;
  const result = await useCase.execute({
    reportScheduleId: req.params.scheduleId,
    ...req.body,
  });
  if (!result) {
    jsonResponse(res, 404, { success: false, error: 'Report schedule not found' });
    return;
  }
  jsonResponse(res, 200, { success: true, data: result });
};

export const deleteSchedule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = deleteReportScheduleUseCase;
  const deleted = await useCase.execute(req.params.scheduleId);
  if (!deleted) {
    jsonResponse(res, 404, { success: false, error: 'Report schedule not found' });
    return;
  }
  jsonResponse(res, 200, { success: true });
};

export const listExecutions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = listReportExecutionsUseCase;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const result = await useCase.execute(req.params.scheduleId, limit);
  jsonResponse(res, 200, { success: true, data: result });
};
