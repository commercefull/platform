import type { ImportErrorRepository } from '../../domain/repositories/MigrationRepository';
import { ImportError } from '../../domain/entities/ImportError';

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
