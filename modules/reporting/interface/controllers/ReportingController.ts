/**
 * Reporting Controller
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';

import type { ReportType } from '../../domain/entities/ReportEntities';
import type { CreateReportScheduleInput } from '../../application/useCases/CreateReportSchedule';
import type { UpdateReportScheduleParams } from '../../infrastructure/repositories/ReportingDataRepository';
import { GenerateReportUseCase } from '../../application/useCases/GenerateReport';
import { GetReportTemplatesUseCase } from '../../application/useCases/GetReportTemplates';
import { CreateReportScheduleUseCase } from '../../application/useCases/CreateReportSchedule';
import { ListReportSchedulesUseCase } from '../../application/useCases/ListReportSchedules';
import { GetReportScheduleUseCase } from '../../application/useCases/GetReportSchedule';
import { UpdateReportScheduleUseCase } from '../../application/useCases/UpdateReportSchedule';
import { DeleteReportScheduleUseCase } from '../../application/useCases/DeleteReportSchedule';
import { ListReportExecutionsUseCase } from '../../application/useCases/ListReportExecutions';

interface GenerateReportBody {
  reportType: ReportType;
  parameters?: Record<string, unknown>;
}

export const generateReport = async (req: TypedRequest<Record<string, string>, unknown, GenerateReportBody>, res: Response): Promise<void> => {
  if (!req.body.reportType) {
    res.status(400).json({ success: false, error: 'reportType is required' });
    return;
  }
  const useCase = new GenerateReportUseCase();
  const result = await useCase.execute({
    reportType: req.body.reportType as ReportType,
    parameters: req.body.parameters || {},
  });
  res.json({ success: true, data: result });
  
};

export const getReportTemplates = async (_req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new GetReportTemplatesUseCase();
  const templates = await useCase.execute();
  const templateList = Object.values(templates);
  res.json({ success: true, data: templateList });
  
};

export const createSchedule = async (req: TypedRequest<Record<string, string>, unknown, CreateReportScheduleInput>, res: Response): Promise<void> => {
  if (!req.body.name || !req.body.reportType) {
    res.status(400).json({ success: false, error: 'name and reportType are required' });
    return;
  }
  const useCase = new CreateReportScheduleUseCase();
  const result = await useCase.execute(req.body);
  res.status(201).json({ success: true, data: result });
  
};

export const listSchedules = async (req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new ListReportSchedulesUseCase();
  const organizationId = req.query.organizationId as string | undefined;
  const result = await useCase.execute(organizationId);
  res.json({ success: true, data: result });
  
};

export const getSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new GetReportScheduleUseCase();
  const result = await useCase.execute(req.params.scheduleId);
  if (!result) {
    res.status(404).json({ success: false, error: 'Report schedule not found' });
    return;
  }
  res.json({ success: true, data: result });
  
};

export const updateSchedule = async (req: TypedRequest<Record<string, string>, unknown, UpdateReportScheduleParams>, res: Response): Promise<void> => {
  const useCase = new UpdateReportScheduleUseCase();
  const result = await useCase.execute({
    reportScheduleId: req.params.scheduleId,
    ...req.body,
  });
  if (!result) {
    res.status(404).json({ success: false, error: 'Report schedule not found' });
    return;
  }
  res.json({ success: true, data: result });
  
};

export const deleteSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new DeleteReportScheduleUseCase();
  const deleted = await useCase.execute(req.params.scheduleId);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Report schedule not found' });
    return;
  }
  res.json({ success: true });
  
};

export const listExecutions = async (req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new ListReportExecutionsUseCase();
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const result = await useCase.execute(req.params.scheduleId, limit);
  res.json({ success: true, data: result });
  
};
