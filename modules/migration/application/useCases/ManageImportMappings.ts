import type { ImportMappingRepository } from '../../domain/repositories/MigrationRepository';
import { ImportMapping } from '../../domain/entities/ImportMapping';

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

