/**
 * DeleteWarehouse Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { WarehouseNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';

export interface DeleteWarehouseInput {
  warehouseId: string;
  force?: boolean;
}

export interface DeleteWarehouseOutput {
  deleted: boolean;
  warehouseId: string;
  deletedAt: string;
}

interface WarehouseRecord {
  warehouseId: string;
  name: string;
}

interface WarehouseRepositoryPort {
  findById(id: string): Promise<WarehouseRecord | null>;
  hasInventory(warehouseId: string): Promise<boolean>;
  hasAssignedStores(warehouseId: string): Promise<boolean>;
  delete(warehouseId: string): Promise<void>;
}

export class DeleteWarehouseUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepositoryPort) {}

  async execute(input: DeleteWarehouseInput): Promise<DeleteWarehouseOutput> {
    const warehouse = await this.warehouseRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new WarehouseNotFoundError(input.warehouseId);
    }

    // Check for existing inventory or assigned stores
    if (!input.force) {
      const hasInventory = await this.warehouseRepository.hasInventory(input.warehouseId);
      if (hasInventory) {
        throw new WarehouseValidationError('Warehouse has inventory. Use force=true to delete anyway.');
      }

      const hasAssignedStores = await this.warehouseRepository.hasAssignedStores(input.warehouseId);
      if (hasAssignedStores) {
        throw new WarehouseValidationError('Warehouse is assigned to stores. Use force=true to delete anyway.');
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
