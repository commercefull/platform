/**
 * UpdateWarehouse Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface UpdateWarehouseInput {
  warehouseId: string;
  name?: string;
  code?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  capacity?: number;
  priorityScore?: number;
  settings?: Record<string, unknown>;
}

export interface UpdateWarehouseOutput {
  warehouseId: string;
  name: string;
  code: string;
  isActive: boolean;
  updatedAt: string;
}

export class UpdateWarehouseUseCase {
  constructor(private readonly warehouseRepository: any) {}

  async execute(input: UpdateWarehouseInput): Promise<UpdateWarehouseOutput> {
    const warehouse = await this.warehouseRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse not found: ${input.warehouseId}`);
    }

    const updates: Record<string, unknown> = {};
    
    if (input.name !== undefined) updates.name = input.name;
    if (input.code !== undefined) updates.code = input.code;
    if (input.address !== undefined) updates.address = input.address;
    if (input.contactPhone !== undefined) updates.contactPhone = input.contactPhone;
    if (input.contactEmail !== undefined) updates.contactEmail = input.contactEmail;
    if (input.operatingHours !== undefined) updates.operatingHours = input.operatingHours;
    if (input.capacity !== undefined) updates.capacity = input.capacity;
    if (input.priorityScore !== undefined) updates.priorityScore = input.priorityScore;
    if (input.settings !== undefined) updates.settings = input.settings;

    const updated = await this.warehouseRepository.update(input.warehouseId, updates);

    eventBus.emit('warehouse.updated', {
      warehouseId: updated.warehouseId,
      name: updated.name,
    });

    return {
      warehouseId: updated.warehouseId,
      name: updated.name,
      code: updated.code,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
