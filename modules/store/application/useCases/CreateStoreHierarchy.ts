/**
 * CreateStoreHierarchy Use Case
 *
 * Creates a store hierarchy for multi-store businesses.
 */

import type { StoreRepository } from '../../domain/repositories/StoreRepository';
import { StoreNotFoundError, StoreValidationError } from '../../domain/errors/StoreErrors';

export interface CreateStoreHierarchyInput {
  organizationId: string;
  name: string;
  defaultStoreId: string;
  storeIds: string[];
  sharedInventoryPoolId?: string;
  sharedCatalogId?: string;
  settings?: {
    allowCrossStoreTransfers: boolean;
    allowCrossStoreFulfillment: boolean;
    centralizedPricing: boolean;
  };
}

export interface CreateStoreHierarchyOutput {
  hierarchyId: string;
  organizationId: string;
  name: string;
  defaultStoreId: string;
  storeCount: number;
  createdAt: string;
}

export class CreateStoreHierarchyUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: CreateStoreHierarchyInput): Promise<CreateStoreHierarchyOutput> {
    if (!input.organizationId || !input.name || !input.defaultStoreId) {
      throw new StoreValidationError('Organization ID, name, and default store ID are required');
    }

    if (!input.storeIds.includes(input.defaultStoreId)) {
      throw new StoreValidationError('Default store must be included in store IDs');
    }

    // Verify all stores exist
    for (const storeId of input.storeIds) {
      const store = await this.storeRepository.findById(storeId);
      if (!store) {
        throw new StoreNotFoundError(storeId);
      }
    }

    const hierarchyId = `hier_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const hierarchy = await this.storeRepository.createHierarchy({
      hierarchyId,
      organizationId: input.organizationId,
      name: input.name,
      defaultStoreId: input.defaultStoreId,
      storeIds: input.storeIds,
      sharedInventoryPoolId: input.sharedInventoryPoolId,
      sharedCatalogId: input.sharedCatalogId,
      settings: input.settings || {
        allowCrossStoreTransfers: true,
        allowCrossStoreFulfillment: true,
        centralizedPricing: false,
      },
    });

    return {
      hierarchyId: hierarchy.hierarchyId,
      organizationId: hierarchy.organizationId,
      name: hierarchy.name,
      defaultStoreId: hierarchy.defaultStoreId,
      storeCount: input.storeIds.length,
      createdAt: hierarchy.createdAt.toISOString(),
    };
  }
}
