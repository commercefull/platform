import { Response } from 'express';
import { TypedRequest } from '../../../../libs/types/express';
import { manageImportJobs, manageImportMappings, manageImportErrors } from '../../application/useCases/wired';
import type { ImportJobType, ImportSource, ImportJobStatus } from '../../domain/entities/ImportJob';

class MigrationController {
  async createJob(req: TypedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user!;
    if (!organizationId) {
      res.status(401).json({ success: false, error: 'Organization not found' });
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
    res.status(201).json({ success: true, data: job.toJSON() });
  }

  async getJob(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const job = await manageImportJobs.getJob(req.params.importJobId);
    res.json({ success: true, data: job.toJSON() });
  }

  async listJobs(req: TypedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user!;
    if (!organizationId) {
      res.status(401).json({ success: false, error: 'Organization not found' });
      return;
    }
    const { status, jobType } = req.query;
    const jobs = await manageImportJobs.listJobs(organizationId, {
      status: status as ImportJobStatus | undefined,
      jobType: jobType as ImportJobType | undefined,
    });
    res.json({ success: true, data: jobs.map(j => j.toJSON()) });
  }

  async startJob(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const job = await manageImportJobs.startJob(req.params.importJobId);
    res.json({ success: true, data: job.toJSON() });
  }

  async completeJob(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const job = await manageImportJobs.completeJob(req.params.importJobId);
    res.json({ success: true, data: job.toJSON() });
  }

  async failJob(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const { errorMessage } = req.body as { errorMessage: string };
    const job = await manageImportJobs.failJob(req.params.importJobId, errorMessage);
    res.json({ success: true, data: job.toJSON() });
  }

  async pauseJob(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const job = await manageImportJobs.pauseJob(req.params.importJobId);
    res.json({ success: true, data: job.toJSON() });
  }

  async cancelJob(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const job = await manageImportJobs.cancelJob(req.params.importJobId);
    res.json({ success: true, data: job.toJSON() });
  }

  async deleteJob(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    await manageImportJobs.deleteJob(req.params.importJobId);
    res.json({ success: true });
  }

  async getMappings(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const { entityType } = req.query;
    const mappings = await manageImportMappings.findByJob(req.params.importJobId, entityType as string | undefined);
    res.json({ success: true, data: mappings.map(m => m.toJSON()) });
  }

  async createMapping(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const { entityType, sourceId, platformId, sourceData } = req.body as Record<string, unknown>;
    const mapping = await manageImportMappings.createMapping({
      importJobId: req.params.importJobId,
      entityType: entityType as string,
      sourceId: sourceId as string,
      platformId: platformId as string,
      sourceData: sourceData as Record<string, unknown> | undefined,
    });
    res.status(201).json({ success: true, data: mapping.toJSON() });
  }

  async lookupMapping(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const { entityType, sourceId } = req.query;
    const mapping = await manageImportMappings.findByJobAndSource(
      req.params.importJobId,
      entityType as string,
      sourceId as string,
    );
    if (!mapping) {
      res.status(404).json({ success: false, error: 'Mapping not found' });
      return;
    }
    res.json({ success: true, data: mapping.toJSON() });
  }

  async getErrors(req: TypedRequest<{ importJobId: string }>, res: Response): Promise<void> {
    const { severity, resolved } = req.query;
    const errors = await manageImportErrors.findByJob(req.params.importJobId, {
      severity: severity as string | undefined,
      resolved: resolved === 'true',
    });
    res.json({ success: true, data: errors.map(e => e.toJSON()) });
  }

  async resolveError(req: TypedRequest<{ importErrorId: string }>, res: Response): Promise<void> {
    const error = await manageImportErrors.resolveError(req.params.importErrorId);
    if (!error) {
      res.status(404).json({ success: false, error: 'Error not found' });
      return;
    }
    res.json({ success: true, data: error.toJSON() });
  }
}

export const migrationController = new MigrationController();
