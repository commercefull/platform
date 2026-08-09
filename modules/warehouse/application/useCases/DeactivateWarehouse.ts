/**
 * DeactivateWarehouse Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface DeactivateWarehouseInput {
  warehouseId: string;
}

export interface DeactivateWarehouseOutput {
  warehouseId: string;
  name: string;
  isActive: boolean;
  deactivatedAt: string;
}

interface WarehouseRecord {
  warehouseId: string;
  name: string;
  isActive: boolean;
}

interface WarehouseRepositoryPort {
  findById(id: string): Promise<WarehouseRecord | null>;
  update(id: string, data: Partial<WarehouseRecord>): Promise<WarehouseRecord>;
}

export class DeactivateWarehouseUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepositoryPort) {}

  async execute(input: DeactivateWarehouseInput): Promise<DeactivateWarehouseOutput> {
    const warehouse = await this.warehouseRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse not found: ${input.warehouseId}`);
    }

    if (!warehouse.isActive) {
      return {
        warehouseId: warehouse.warehouseId,
        name: warehouse.name,
        isActive: false,
        deactivatedAt: new Date().toISOString(),
      };
    }

    const updated = await this.warehouseRepository.update(input.warehouseId, {
      isActive: false,
    });

    eventBus.emit('warehouse.deactivated', {
      warehouseId: updated.warehouseId,
      name: updated.name,
    });

    return {
      warehouseId: updated.warehouseId,
      name: updated.name,
      isActive: false,
      deactivatedAt: new Date().toISOString(),
    };
  }
}
