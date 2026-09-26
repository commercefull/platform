/**
 * ManageReceiving Use Case
 *
 * Receiving record + item read/write façade shared by HTTP controllers and
 * admin views. Owns the status/warehouse/supplier listing fan-out, item field
 * validation, and the accept/reject guards.
 */

import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

export interface ReceivingRecordPort {
  findByStatus(status: string, limit?: number): Promise<unknown[]>;
  findByWarehouseId(warehouseId: string, limit?: number): Promise<unknown[]>;
  findBySupplierId(supplierId: string, limit?: number): Promise<unknown[]>;
  findAll(limit?: number): Promise<unknown[]>;
  findById(id: string): Promise<unknown>;
  findByPurchaseOrderId(purchaseOrderId: string): Promise<unknown[]>;
  update(id: string, params: Record<string, unknown>): Promise<unknown>;
  complete(id: string): Promise<unknown>;
}

export interface ReceivingItemPort {
  findByReceivingRecordId(recordId: string): Promise<unknown[]>;
  create(params: Record<string, unknown>): Promise<unknown>;
  update(id: string, params: Record<string, unknown>): Promise<unknown>;
  accept(id: string, processedBy?: string): Promise<unknown>;
  reject(id: string, reason: string, processedBy?: string): Promise<unknown>;
}

export interface ListReceivingRecordsQuery {
  status?: string;
  warehouseId?: string;
  supplierId?: string;
  limit: number;
}

export interface CreateReceivingItemInput {
  productId?: string;
  sku?: string;
  name?: string;
  receivedQuantity?: number;
  [key: string]: unknown;
}

export class ManageReceivingUseCase {
  constructor(
    private readonly records: ReceivingRecordPort,
    private readonly items: ReceivingItemPort,
  ) {}

  async listReceivingRecords(query: ListReceivingRecordsQuery): Promise<unknown[]> {
    if (query.status) {
      return this.records.findByStatus(query.status, query.limit);
    }
    if (query.warehouseId) {
      return this.records.findByWarehouseId(query.warehouseId, query.limit);
    }
    if (query.supplierId) {
      return this.records.findBySupplierId(query.supplierId, query.limit);
    }
    return this.records.findAll(query.limit);
  }

  async getReceivingRecord(id: string): Promise<unknown> {
    return this.records.findById(id);
  }

  async getByPurchaseOrder(purchaseOrderId: string): Promise<unknown[]> {
    return this.records.findByPurchaseOrderId(purchaseOrderId);
  }

  async updateReceivingRecord(id: string, params: Record<string, unknown>): Promise<unknown> {
    return this.records.update(id, params);
  }

  async completeReceiving(id: string): Promise<unknown> {
    return this.records.complete(id);
  }

  async getItems(recordId: string): Promise<unknown[]> {
    return this.items.findByReceivingRecordId(recordId);
  }

  async createItem(recordId: string, input: CreateReceivingItemInput): Promise<unknown> {
    const itemParams = {
      supplierReceivingRecordId: recordId,
      ...input,
    };

    const errors: string[] = [];
    if (!itemParams.productId) errors.push('productId is required');
    if (!itemParams.sku) errors.push('sku is required');
    if (!itemParams.name) errors.push('name is required');
    if (!itemParams.receivedQuantity || itemParams.receivedQuantity < 0) errors.push('receivedQuantity must be non-negative');

    if (errors.length > 0) {
      throw new SupplierValidationError(errors.join('; '));
    }

    return this.items.create(itemParams);
  }

  async updateItem(id: string, params: Record<string, unknown>): Promise<unknown> {
    return this.items.update(id, params);
  }

  async acceptItem(id: string, processedBy?: string): Promise<unknown> {
    return this.items.accept(id, processedBy);
  }

  async rejectItem(id: string, reason?: string, processedBy?: string): Promise<unknown> {
    if (!reason) {
      throw new SupplierValidationError('reason is required');
    }
    return this.items.reject(id, reason, processedBy);
  }
}
