import type { ImportJobRepository } from '../../domain/repositories/MigrationRepository';
import { ImportJob, type ImportJobType, type ImportSource, type ImportJobStatus } from '../../domain/entities/ImportJob';
import { ImportJobNotFoundError } from '../../domain/errors/MigrationErrors';

export class ManageImportJobsUseCase {
  constructor(private importJobRepo: ImportJobRepository) {}

  async createJob(params: {
    organizationId: string;
    jobType: ImportJobType;
    source: ImportSource;
    sourceStoreUrl?: string;
    sourceApiKey?: string;
    sourceConfig?: Record<string, unknown>;
    dryRun?: boolean;
    autoActivate?: boolean;
  }): Promise<ImportJob> {
    const job = ImportJob.create(params);
    return this.importJobRepo.create(job);
  }

  async getJob(importJobId: string): Promise<ImportJob> {
    const job = await this.importJobRepo.findById(importJobId);
    if (!job) throw new ImportJobNotFoundError(importJobId);
    return job;
  }

  async listJobs(organizationId: string, filters?: { status?: ImportJobStatus; jobType?: ImportJobType }): Promise<ImportJob[]> {
    return this.importJobRepo.findByOrganization(organizationId, filters);
  }

  async startJob(importJobId: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.start();
    return this.importJobRepo.update(job);
  }

  async completeJob(importJobId: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.complete();
    return this.importJobRepo.update(job);
  }

  async failJob(importJobId: string, errorMessage: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.fail(errorMessage);
    return this.importJobRepo.update(job);
  }

  async pauseJob(importJobId: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.pause();
    return this.importJobRepo.update(job);
  }

  async cancelJob(importJobId: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.cancel();
    return this.importJobRepo.update(job);
  }

  async setTotalRecords(importJobId: string, count: number): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.setTotalRecords(count);
    return this.importJobRepo.update(job);
  }

  async recordSuccess(importJobId: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.recordSuccess();
    return this.importJobRepo.update(job);
  }

  async recordError(importJobId: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.recordError();
    return this.importJobRepo.update(job);
  }

  async recordSkipped(importJobId: string): Promise<ImportJob> {
    const job = await this.getJob(importJobId);
    job.recordSkipped();
    return this.importJobRepo.update(job);
  }

  async deleteJob(importJobId: string): Promise<boolean> {
    return this.importJobRepo.delete(importJobId);
  }
}

