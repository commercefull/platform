/**
 * CreateStoreHierarchy Use Case
 * 
 * Creates a store hierarchy for multi-store businesses.
 */

export interface CreateStoreHierarchyInput {
  businessId: string;
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
  businessId: string;
  name: string;
  defaultStoreId: string;
  storeCount: number;
  createdAt: string;
}

export class CreateStoreHierarchyUseCase {
  constructor(private readonly storeRepository: any) {}

  async execute(input: CreateStoreHierarchyInput): Promise<CreateStoreHierarchyOutput> {
    if (!input.businessId || !input.name || !input.defaultStoreId) {
      throw new Error('Business ID, name, and default store ID are required');
    }

    if (!input.storeIds.includes(input.defaultStoreId)) {
      throw new Error('Default store must be included in store IDs');
    }

    // Verify all stores exist
    for (const storeId of input.storeIds) {
      const store = await this.storeRepository.findById(storeId);
      if (!store) {
        throw new Error(`Store not found: ${storeId}`);
      }
    }

    const hierarchyId = `hier_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const hierarchy = await this.storeRepository.createHierarchy({
      hierarchyId,
      businessId: input.businessId,
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
      businessId: hierarchy.businessId,
      name: hierarchy.name,
      defaultStoreId: hierarchy.defaultStoreId,
      storeCount: input.storeIds.length,
      createdAt: hierarchy.createdAt.toISOString(),
    };
  }
}
