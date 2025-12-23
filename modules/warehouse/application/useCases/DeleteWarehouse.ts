/**
 * DeleteWarehouse Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface DeleteWarehouseInput {
  warehouseId: string;
  force?: boolean;
}

export interface DeleteWarehouseOutput {
  deleted: boolean;
  warehouseId: string;
  deletedAt: string;
}

export class DeleteWarehouseUseCase {
  constructor(private readonly warehouseRepository: any) {}

  async execute(input: DeleteWarehouseInput): Promise<DeleteWarehouseOutput> {
    const warehouse = await this.warehouseRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse not found: ${input.warehouseId}`);
    }

    // Check for existing inventory or assigned stores
    if (!input.force) {
      const hasInventory = await this.warehouseRepository.hasInventory(input.warehouseId);
      if (hasInventory) {
        throw new Error('Warehouse has inventory. Use force=true to delete anyway.');
      }

      const hasAssignedStores = await this.warehouseRepository.hasAssignedStores(input.warehouseId);
      if (hasAssignedStores) {
        throw new Error('Warehouse is assigned to stores. Use force=true to delete anyway.');
      }
    }

    await this.warehouseRepository.delete(input.warehouseId);

    eventBus.emit('warehouse.deleted', {
      warehouseId: input.warehouseId,
    });

    return {
      deleted: true,
      warehouseId: input.warehouseId,
      deletedAt: new Date().toISOString(),
    };
  }
}
