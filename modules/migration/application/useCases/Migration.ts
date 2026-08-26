import type { ImportJobRepository, ImportMappingRepository, ImportErrorRepository } from '../../domain/repositories/MigrationRepository';
import { ImportJob, type ImportJobType, type ImportSource, type ImportJobStatus } from '../../domain/entities/ImportJob';
import { ImportMapping } from '../../domain/entities/ImportMapping';
import { ImportError } from '../../domain/entities/ImportError';
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

export class ManageImportMappingsUseCase {
  constructor(private importMappingRepo: ImportMappingRepository) {}

  async createMapping(params: {
    importJobId: string;
    entityType: string;
    sourceId: string;
    platformId: string;
    sourceData?: Record<string, unknown>;
  }): Promise<ImportMapping> {
    const mapping = ImportMapping.create(params);
    return this.importMappingRepo.create(mapping);
  }

  async getMapping(importMappingId: string): Promise<ImportMapping | null> {
    return this.importMappingRepo.findById(importMappingId);
  }

  async findByJobAndSource(importJobId: string, entityType: string, sourceId: string): Promise<ImportMapping | null> {
    return this.importMappingRepo.findByJobAndSource(importJobId, entityType, sourceId);
  }

  async findByJob(importJobId: string, entityType?: string): Promise<ImportMapping[]> {
    return this.importMappingRepo.findByJob(importJobId, entityType);
  }

  async findByPlatformId(entityType: string, platformId: string): Promise<ImportMapping | null> {
    return this.importMappingRepo.findByPlatformId(entityType, platformId);
  }

  async deleteByJob(importJobId: string): Promise<boolean> {
    return this.importMappingRepo.deleteByJob(importJobId);
  }
}

export class ManageImportErrorsUseCase {
  constructor(private importErrorRepo: ImportErrorRepository) {}

  async createError(params: {
    importJobId: string;
    entityType: string;
    message: string;
    sourceId?: string;
    severity?: 'error' | 'warning' | 'info';
    stackTrace?: string;
    rawData?: Record<string, unknown>;
  }): Promise<ImportError> {
    const error = ImportError.create(params);
    return this.importErrorRepo.create(error);
  }

  async getError(importErrorId: string): Promise<ImportError | null> {
    return this.importErrorRepo.findById(importErrorId);
  }

  async findByJob(importJobId: string, filters?: { severity?: string; resolved?: boolean }): Promise<ImportError[]> {
    return this.importErrorRepo.findByJob(importJobId, filters);
  }

  async resolveError(importErrorId: string): Promise<ImportError | null> {
    const error = await this.importErrorRepo.findById(importErrorId);
    if (!error) return null;
    error.resolve();
    return this.importErrorRepo.update(error);
  }

  async deleteByJob(importJobId: string): Promise<boolean> {
    return this.importErrorRepo.deleteByJob(importJobId);
  }
}
