/**
 * ManageReceiving Use Case
 *
 * Receiving-record lifecycle within a warehouse: create (validated) and
 * complete — which records received items/discrepancies before transitioning
 * the record to completed — emitting the corresponding domain events.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { ReceivingRecordNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type { CreateReceivingInput, WarehouseReceiving } from '../../domain/repositories/WarehouseRepository';

interface ReceivingRepositoryPort {
  create(input: CreateReceivingInput): Promise<WarehouseReceiving>;
  updateItems(id: string, items: Record<string, unknown>[], hasDiscrepancies: boolean): Promise<WarehouseReceiving | null>;
  updateStatus(id: string, status: string, receivedBy?: string): Promise<WarehouseReceiving | null>;
  findById(id: string): Promise<WarehouseReceiving | null>;
  findByWarehouse(warehouseId: string, status?: string): Promise<WarehouseReceiving[]>;
}

export class ManageReceivingUseCase {
  constructor(private readonly receiving: ReceivingRepositoryPort) {}

  async create(warehouseId: string, input: Omit<CreateReceivingInput, 'distributionWarehouseId'>): Promise<WarehouseReceiving> {
    if (!input.receiptNumber || !input.sourceType) {
      throw new WarehouseValidationError('receiptNumber and sourceType are required');
    }

    const record = await this.receiving.create({ ...input, distributionWarehouseId: warehouseId });

    eventBus.emit('warehouse.receiving.created', {
      receivingId: record.warehouseReceivingId,
      warehouseId,
      receiptNumber: input.receiptNumber,
    });

    return record;
  }

  async complete(
    receivingId: string,
    input: { receivedBy?: string; items?: Record<string, unknown>[]; hasDiscrepancies?: boolean },
  ): Promise<WarehouseReceiving> {
    if (input.items) {
      await this.receiving.updateItems(receivingId, input.items, input.hasDiscrepancies ?? false);
    }

    const record = await this.receiving.updateStatus(receivingId, 'completed', input.receivedBy);

    if (!record) {
      throw new ReceivingRecordNotFoundError(receivingId);
    }

    eventBus.emit('warehouse.receiving.completed', {
      receivingId: record.warehouseReceivingId,
      warehouseId: record.distributionWarehouseId,
    });

    return record;
  }

  async findById(id: string): Promise<WarehouseReceiving | null> {
    return this.receiving.findById(id);
  }

  async findByWarehouse(warehouseId: string, status?: string): Promise<WarehouseReceiving[]> {
    return this.receiving.findByWarehouse(warehouseId, status);
  }
}
