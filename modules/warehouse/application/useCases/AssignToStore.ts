/**
 * AssignToStore Use Case
 * 
 * Assigns a warehouse to a store for inventory fulfillment.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface AssignToStoreInput {
  warehouseId: string;
  storeId: string;
  priority?: number;
  isDefault?: boolean;
}

export interface AssignToStoreOutput {
  warehouseId: string;
  storeId: string;
  priority: number;
  isDefault: boolean;
  assignedAt: string;
}

export class AssignToStoreUseCase {
  constructor(
    private readonly warehouseRepository: any,
    private readonly storeRepository: any
  ) {}

  async execute(input: AssignToStoreInput): Promise<AssignToStoreOutput> {
    const warehouse = await this.warehouseRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse not found: ${input.warehouseId}`);
    }

    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new Error(`Store not found: ${input.storeId}`);
    }

    // If setting as default, unset other default warehouses for this store
    if (input.isDefault) {
      await this.warehouseRepository.unsetDefaultForStore(input.storeId);
    }

    const assignment = await this.warehouseRepository.assignToStore({
      warehouseId: input.warehouseId,
      storeId: input.storeId,
      priority: input.priority ?? 0,
      isDefault: input.isDefault ?? false,
    });

    eventBus.emit('warehouse.assigned_to_store', {
      warehouseId: input.warehouseId,
      storeId: input.storeId,
      isDefault: input.isDefault ?? false,
    });

    return {
      warehouseId: assignment.warehouseId,
      storeId: assignment.storeId,
      priority: assignment.priority,
      isDefault: assignment.isDefault,
      assignedAt: new Date().toISOString(),
    };
  }
}
