/**
 * ManageZones Use Case
 *
 * Zone lifecycle within a warehouse: create (validated), update, and delete,
 * emitting the corresponding domain events.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { WarehouseValidationError, ZoneNotFoundError } from '../../domain/errors/WarehouseErrors';
import type { CreateZoneInput, UpdateZoneInput, WarehouseZone } from '../../domain/repositories/WarehouseRepository';

interface ZoneRepositoryPort {
  createZone(input: CreateZoneInput): Promise<WarehouseZone>;
  updateZone(zoneId: string, input: UpdateZoneInput): Promise<WarehouseZone | null>;
  deleteZone(zoneId: string): Promise<boolean>;
  findZoneById(zoneId: string): Promise<WarehouseZone | null>;
  findZonesByWarehouse(warehouseId: string): Promise<WarehouseZone[]>;
}

export class ManageZonesUseCase {
  constructor(private readonly zones: ZoneRepositoryPort) {}

  async create(warehouseId: string, input: Omit<CreateZoneInput, 'distributionWarehouseId'>): Promise<WarehouseZone> {
    if (!input.name || !input.code) {
      throw new WarehouseValidationError('name and code are required');
    }

    const zone = await this.zones.createZone({ ...input, distributionWarehouseId: warehouseId });

    eventBus.emit('warehouse.zone.created', {
      zoneId: zone.distributionWarehouseZoneId,
      warehouseId,
      name: input.name,
      code: input.code,
    });

    return zone;
  }

  async update(zoneId: string, input: UpdateZoneInput): Promise<WarehouseZone> {
    const zone = await this.zones.updateZone(zoneId, input);

    if (!zone) {
      throw new ZoneNotFoundError(zoneId);
    }

    eventBus.emit('warehouse.zone.updated', { zoneId, changes: input });

    return zone;
  }

  async delete(zoneId: string): Promise<void> {
    await this.zones.deleteZone(zoneId);
    eventBus.emit('warehouse.zone.deleted', { zoneId });
  }

  async findZoneById(zoneId: string): Promise<WarehouseZone | null> {
    return this.zones.findZoneById(zoneId);
  }

  async findZonesByWarehouse(warehouseId: string): Promise<WarehouseZone[]> {
    return this.zones.findZonesByWarehouse(warehouseId);
  }
}
