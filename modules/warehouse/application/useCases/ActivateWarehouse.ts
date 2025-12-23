/**
 * ActivateWarehouse Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ActivateWarehouseInput {
  warehouseId: string;
}

export interface ActivateWarehouseOutput {
  warehouseId: string;
  name: string;
  isActive: boolean;
  activatedAt: string;
}

export class ActivateWarehouseUseCase {
  constructor(private readonly warehouseRepository: any) {}

  async execute(input: ActivateWarehouseInput): Promise<ActivateWarehouseOutput> {
    const warehouse = await this.warehouseRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse not found: ${input.warehouseId}`);
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
