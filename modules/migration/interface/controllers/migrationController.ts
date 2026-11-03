import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageImportJobs, manageImportMappings, manageImportErrors } from '../../application/useCases/wired';
import type { ImportJobType, ImportSource, ImportJobStatus } from '../../domain/entities/ImportJob';

class MigrationController {
  createJob = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = req.user?.organizationId || req.user?.id;
    if (!organizationId) {
      jsonResponse(res, 401, { success: false, error: 'Organization not found' });
      return;
    }
    const { jobType, source, sourceStoreUrl, sourceApiKey, sourceConfig, dryRun, autoActivate } = req.body as Record<string, unknown>;

    const job = await manageImportJobs.createJob({
      organizationId,
      jobType: jobType as ImportJobType,
      source: source as ImportSource,
      sourceStoreUrl: sourceStoreUrl as string | undefined,
      sourceApiKey: sourceApiKey as string | undefined,
      sourceConfig: sourceConfig as Record<string, unknown> | undefined,
      dryRun: dryRun as boolean | undefined,
      autoActivate: autoActivate as boolean | undefined,
    });
    jsonResponse(res, 201, { success: true, data: job.toJSON() });
  };

  getJob = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const job = await manageImportJobs.getJob(req.params.importJobId);
    jsonResponse(res, 200, { success: true, data: job.toJSON() });
  };

  listJobs = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = req.user?.organizationId || req.user?.id;
    if (!organizationId) {
      jsonResponse(res, 401, { success: false, error: 'Organization not found' });
      return;
    }
    const { status, jobType } = req.query;
    const jobs = await manageImportJobs.listJobs(organizationId, {
      status: status as ImportJobStatus | undefined,
      jobType: jobType as ImportJobType | undefined,
    });
    jsonResponse(res, 200, { success: true, data: jobs.map(j => j.toJSON()) });
  };

  startJob = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const job = await manageImportJobs.startJob(req.params.importJobId);
    jsonResponse(res, 200, { success: true, data: job.toJSON() });
  };

  completeJob = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const job = await manageImportJobs.completeJob(req.params.importJobId);
    jsonResponse(res, 200, { success: true, data: job.toJSON() });
  };

  failJob = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const { errorMessage } = req.body as { errorMessage: string };
    const job = await manageImportJobs.failJob(req.params.importJobId, errorMessage);
    jsonResponse(res, 200, { success: true, data: job.toJSON() });
  };

  pauseJob = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const job = await manageImportJobs.pauseJob(req.params.importJobId);
    jsonResponse(res, 200, { success: true, data: job.toJSON() });
  };

  cancelJob = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const job = await manageImportJobs.cancelJob(req.params.importJobId);
    jsonResponse(res, 200, { success: true, data: job.toJSON() });
  };

  deleteJob = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    await manageImportJobs.deleteJob(req.params.importJobId);
    jsonResponse(res, 200, { success: true });
  };

  getMappings = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const { entityType } = req.query;
    const mappings = await manageImportMappings.findByJob(req.params.importJobId, entityType as string | undefined);
    jsonResponse(res, 200, { success: true, data: mappings.map(m => m.toJSON()) });
  };

  createMapping = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const { entityType, sourceId, platformId, sourceData } = req.body as Record<string, unknown>;
    const mapping = await manageImportMappings.createMapping({
      importJobId: req.params.importJobId,
      entityType: entityType as string,
      sourceId: sourceId as string,
      platformId: platformId as string,
      sourceData: sourceData as Record<string, unknown> | undefined,
    });
    jsonResponse(res, 201, { success: true, data: mapping.toJSON() });
  };

  lookupMapping = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const { entityType, sourceId } = req.query;
    const mapping = await manageImportMappings.findByJobAndSource(req.params.importJobId, entityType as string, sourceId as string);
    if (!mapping) {
      jsonResponse(res, 404, { success: false, error: 'Mapping not found' });
      return;
    }
    jsonResponse(res, 200, { success: true, data: mapping.toJSON() });
  };

  getErrors = async (req: HttpRequest<{ importJobId: string }>, res: HttpResponse): Promise<void> => {
    const { severity, resolved } = req.query;
    const errors = await manageImportErrors.findByJob(req.params.importJobId, {
      severity: severity as string | undefined,
      resolved: resolved === 'true',
    });
    jsonResponse(res, 200, { success: true, data: errors.map(e => e.toJSON()) });
  };

  resolveError = async (req: HttpRequest<{ importErrorId: string }>, res: HttpResponse): Promise<void> => {
    const error = await manageImportErrors.resolveError(req.params.importErrorId);
    if (!error) {
      jsonResponse(res, 404, { success: false, error: 'Error not found' });
      return;
    }
    jsonResponse(res, 200, { success: true, data: error.toJSON() });
  };
}

export const migrationController = new MigrationController();
