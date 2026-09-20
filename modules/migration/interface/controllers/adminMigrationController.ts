/**
 * Migration Admin UI Controller
 * Admin views for managing import jobs
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageImportJobs, manageImportMappings, manageImportErrors } from '../../application/useCases/wired';
import type { ImportJobType, ImportSource, ImportJobStatus } from '../../domain/entities/ImportJob';
import { adminRespond } from '../../../../libs/adminRespond';

export const listImportJobs = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.user!;
  if (!organizationId) {
    adminRespond(req, res, 'error', { pageName: 'Error', error: 'Organization not found' });
    return;
  }

  const { status, jobType } = req.query;
  const jobs = await manageImportJobs.listJobs(organizationId, {
    status: status as ImportJobStatus | undefined,
    jobType: jobType as ImportJobType | undefined,
  });

  adminRespond(req, res, 'migration/index', {
    pageName: 'Import Jobs',
    jobs: jobs.map(j => j.toJSON()),
    filters: { status: status || '', jobType: jobType || '' },
    success: req.query.success || null,
  });
};

export const viewImportJob = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importJobId } = req.params;
  const job = await manageImportJobs.getJob(importJobId);

  if (!job) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Import job not found' });
    return;
  }

  adminRespond(req, res, 'migration/view', {
    pageName: `Import Job: ${job.jobType}`,
    job: job.toJSON(),
    success: req.query.success || null,
  });
};

export const createImportJobForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'migration/create', { pageName: 'Create Import Job' });
};

export const createImportJob = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.user!;
  if (!organizationId) {
    adminRespond(req, res, 'error', { pageName: 'Error', error: 'Organization not found' });
    return;
  }

  const body = req.body as HttpRequestBody;
  const job = await manageImportJobs.createJob({
    organizationId,
    jobType: body.jobType as ImportJobType,
    source: body.source as ImportSource,
    sourceStoreUrl: body.sourceStoreUrl as string | undefined,
    sourceApiKey: body.sourceApiKey as string | undefined,
    sourceConfig: body.sourceConfig as Record<string, unknown> | undefined,
    dryRun: body.dryRun as boolean | undefined,
    autoActivate: body.autoActivate as boolean | undefined,
  });

  res.redirect(`/admin/migration/${job.importJobId}?success=Import job created successfully`);
};

export const startImportJob = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importJobId } = req.params;
  await manageImportJobs.startJob(importJobId);
  res.redirect(`/admin/migration/${importJobId}?success=Import job started`);
};

export const pauseImportJob = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importJobId } = req.params;
  await manageImportJobs.pauseJob(importJobId);
  res.redirect(`/admin/migration/${importJobId}?success=Import job paused`);
};

export const cancelImportJob = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importJobId } = req.params;
  await manageImportJobs.cancelJob(importJobId);
  res.redirect(`/admin/migration/${importJobId}?success=Import job cancelled`);
};

export const deleteImportJob = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importJobId } = req.params;
  await manageImportJobs.deleteJob(importJobId);
  res.redirect('/admin/migration?success=Import job deleted');
};

export const viewImportMappings = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importJobId } = req.params;
  const { entityType } = req.query;
  const mappings = await manageImportMappings.findByJob(importJobId, entityType as string | undefined);

  adminRespond(req, res, 'migration/mappings', {
    pageName: 'Import Mappings',
    mappings: mappings.map(m => m.toJSON()),
    importJobId,
    entityType: entityType || '',
  });
};

export const viewImportErrors = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importJobId } = req.params;
  const { severity, resolved } = req.query;
  const errors = await manageImportErrors.findByJob(importJobId, {
    severity: severity as string | undefined,
    resolved: resolved === 'true',
  });

  adminRespond(req, res, 'migration/errors', {
    pageName: 'Import Errors',
    errors: errors.map(e => e.toJSON()),
    importJobId,
    severity: severity || '',
    resolved: resolved || '',
  });
};

export const resolveImportError = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { importErrorId } = req.params;
  await manageImportErrors.resolveError(importErrorId);
  res.redirect('back');
};
