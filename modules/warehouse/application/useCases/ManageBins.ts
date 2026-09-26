/**
 * ManageBins Use Case
 *
 * Bin lifecycle within a warehouse: create (validated), update, and delete,
 * emitting the corresponding domain events.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { BinNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type { CreateBinInput, UpdateBinInput, WarehouseBin } from '../../domain/repositories/WarehouseRepository';

interface BinRepositoryPort {
  createBin(input: CreateBinInput): Promise<WarehouseBin>;
  updateBin(binId: string, input: UpdateBinInput): Promise<WarehouseBin | null>;
  deleteBin(binId: string): Promise<boolean>;
  findBinById(binId: string): Promise<WarehouseBin | null>;
  findBinsByWarehouse(warehouseId: string): Promise<WarehouseBin[]>;
}

export class ManageBinsUseCase {
  constructor(private readonly bins: BinRepositoryPort) {}

  async create(warehouseId: string, input: Omit<CreateBinInput, 'distributionWarehouseId'>): Promise<WarehouseBin> {
    if (!input.locationCode || !input.binType) {
      throw new WarehouseValidationError('locationCode and binType are required');
    }

    const bin = await this.bins.createBin({ ...input, distributionWarehouseId: warehouseId });

    eventBus.emit('warehouse.bin.created', {
      binId: bin.distributionWarehouseBinId,
      warehouseId,
      locationCode: input.locationCode,
    });

    return bin;
  }

  async update(binId: string, input: UpdateBinInput): Promise<WarehouseBin> {
    const bin = await this.bins.updateBin(binId, input);

    if (!bin) {
      throw new BinNotFoundError(binId);
    }

    eventBus.emit('warehouse.bin.updated', { binId, changes: input });

    return bin;
  }

  async delete(binId: string): Promise<void> {
    await this.bins.deleteBin(binId);
    eventBus.emit('warehouse.bin.deleted', { binId });
  }

  async findBinById(binId: string): Promise<WarehouseBin | null> {
    return this.bins.findBinById(binId);
  }

  async findBinsByWarehouse(warehouseId: string): Promise<WarehouseBin[]> {
    return this.bins.findBinsByWarehouse(warehouseId);
  }
}
