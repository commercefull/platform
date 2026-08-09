/**
 * Reporting Controller
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../../libs/logger';

import type { ReportType } from '../../domain/entities/ReportEntities';
import type { CreateReportScheduleInput } from 'modules/reporting/application/useCases/CreateReportSchedule';
import type { UpdateReportScheduleParams } from '../../infrastructure/repositories/reportingRepo';
import { GenerateReportUseCase } from 'modules/reporting/application/useCases/GenerateReport';
import { GetReportTemplatesUseCase } from 'modules/reporting/application/useCases/GetReportTemplates';
import { CreateReportScheduleUseCase } from 'modules/reporting/application/useCases/CreateReportSchedule';
import { ListReportSchedulesUseCase } from 'modules/reporting/application/useCases/ListReportSchedules';
import { GetReportScheduleUseCase } from 'modules/reporting/application/useCases/GetReportSchedule';
import { UpdateReportScheduleUseCase } from 'modules/reporting/application/useCases/UpdateReportSchedule';
import { DeleteReportScheduleUseCase } from 'modules/reporting/application/useCases/DeleteReportSchedule';
import { ListReportExecutionsUseCase } from 'modules/reporting/application/useCases/ListReportExecutions';

interface GenerateReportBody {
  reportType: ReportType;
  parameters?: Record<string, unknown>;
}

export const generateReport = async (req: TypedRequest<Record<string, string>, unknown, GenerateReportBody>, res: Response): Promise<void> => {
  try {
    const useCase = new GenerateReportUseCase();
    const result = await useCase.execute({
      reportType: req.body.reportType as ReportType,
      parameters: req.body.parameters || {},
    });
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error generating report:', error);
    res.status(400).json({ success: false, error: (error as Error).message || 'Failed to generate report' });
  }
};

export const getReportTemplates = async (_req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new GetReportTemplatesUseCase();
    const templates = await useCase.execute();
    res.json({ success: true, data: templates });
  } catch (error: unknown) {
    logger.error('Error getting report templates:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createSchedule = async (req: TypedRequest<Record<string, string>, unknown, CreateReportScheduleInput>, res: Response): Promise<void> => {
  try {
    const useCase = new CreateReportScheduleUseCase();
    const result = await useCase.execute(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error creating report schedule:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const listSchedules = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ListReportSchedulesUseCase();
    const merchantId = req.query.merchantId as string | undefined;
    const result = await useCase.execute(merchantId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error listing report schedules:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new GetReportScheduleUseCase();
    const result = await useCase.execute(req.params.scheduleId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Report schedule not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error getting report schedule:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const updateSchedule = async (req: TypedRequest<Record<string, string>, unknown, UpdateReportScheduleParams>, res: Response): Promise<void> => {
  try {
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
  } catch (error: unknown) {
    logger.error('Error updating report schedule:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deleteSchedule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new DeleteReportScheduleUseCase();
    const deleted = await useCase.execute(req.params.scheduleId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Report schedule not found' });
      return;
    }
    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error deleting report schedule:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const listExecutions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ListReportExecutionsUseCase();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await useCase.execute(req.params.scheduleId, limit);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error listing report executions:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
