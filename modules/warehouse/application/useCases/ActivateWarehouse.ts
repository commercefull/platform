/**
 * ActivateWarehouse Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { WarehouseNotFoundError } from '../../domain/errors/WarehouseErrors';

export interface ActivateWarehouseInput {
  warehouseId: string;
}

export interface ActivateWarehouseOutput {
  warehouseId: string;
  name: string;
  isActive: boolean;
  activatedAt: string;
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

export class ActivateWarehouseUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepositoryPort) {}

  async execute(input: ActivateWarehouseInput): Promise<ActivateWarehouseOutput> {
    const warehouse = await this.warehouseRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new WarehouseNotFoundError(input.warehouseId);
    }

    if (warehouse.isActive) {
      return {
        warehouseId: warehouse.warehouseId,
        name: warehouse.name,
        isActive: true,
        activatedAt: new Date().toISOString(),
      };
    }

    const updated = await this.warehouseRepository.update(input.warehouseId, {
      isActive: true,
    });

    eventBus.emit('warehouse.activated', {
      warehouseId: updated.warehouseId,
      name: updated.name,
    });

    return {
      warehouseId: updated.warehouseId,
      name: updated.name,
      isActive: true,
      activatedAt: new Date().toISOString(),
    };
  }
}
