import type { ImportJob, ImportJobStatus, ImportJobType } from '../entities/ImportJob';
import type { ImportMapping } from '../entities/ImportMapping';
import type { ImportError } from '../entities/ImportError';

export interface ImportJobRepository {
  create(job: ImportJob): Promise<ImportJob>;
  findById(importJobId: string): Promise<ImportJob | null>;
  findByOrganization(organizationId: string, filters?: { status?: ImportJobStatus; jobType?: ImportJobType }): Promise<ImportJob[]>;
  update(job: ImportJob): Promise<ImportJob>;
  delete(importJobId: string): Promise<boolean>;
}

export interface ImportMappingRepository {
  create(mapping: ImportMapping): Promise<ImportMapping>;
  findById(importMappingId: string): Promise<ImportMapping | null>;
  findByJobAndSource(importJobId: string, entityType: string, sourceId: string): Promise<ImportMapping | null>;
  findByJob(importJobId: string, entityType?: string): Promise<ImportMapping[]>;
  findByPlatformId(entityType: string, platformId: string): Promise<ImportMapping | null>;
  deleteByJob(importJobId: string): Promise<boolean>;
}

export interface ImportErrorRepository {
  create(error: ImportError): Promise<ImportError>;
  findById(importErrorId: string): Promise<ImportError | null>;
  findByJob(importJobId: string, filters?: { severity?: string; resolved?: boolean }): Promise<ImportError[]>;
  update(error: ImportError): Promise<ImportError>;
  deleteByJob(importJobId: string): Promise<boolean>;
}
