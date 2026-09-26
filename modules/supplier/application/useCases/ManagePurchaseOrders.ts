/**
 * ManagePurchaseOrders Use Case
 *
 * Purchase-order read/write façade shared by HTTP controllers, GraphQL
 * resolvers, and admin views. Owns the status/supplier/warehouse listing
 * fan-out and purchase-order-item field validation.
 */

import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

export interface PurchaseOrderPort {
  findByStatus(status: string, limit?: number, offset?: number): Promise<unknown[]>;
  findBySupplierId(supplierId: string, limit?: number, offset?: number): Promise<unknown[]>;
  findByWarehouseId(warehouseId: string, limit?: number, offset?: number): Promise<unknown[]>;
  findAll(limit?: number, offset?: number): Promise<unknown[]>;
  findById(id: string): Promise<unknown>;
  update(id: string, params: Record<string, unknown>): Promise<unknown>;
  delete(id: string): Promise<boolean>;
  approve(id: string): Promise<unknown>;
  cancel(id: string): Promise<unknown>;
  send(id: string): Promise<unknown>;
  findItemsByOrderId(orderId: string): Promise<unknown[]>;
  createItem(params: Record<string, unknown>): Promise<unknown>;
  updateItem(id: string, params: Record<string, unknown>): Promise<unknown>;
  deleteItem(id: string): Promise<boolean>;
}

export interface ListPurchaseOrdersQuery {
  status?: string;
  supplierId?: string;
  warehouseId?: string;
  limit: number;
  offset: number;
}

export interface CreatePurchaseOrderItemInput {
  productId?: string;
  sku?: string;
  name?: string;
  quantity?: number;
  unitCostCents?: number;
  totalCents?: number;
  [key: string]: unknown;
}

export class ManagePurchaseOrdersUseCase {
  constructor(private readonly purchaseOrders: PurchaseOrderPort) {}

  async listPurchaseOrders(query: ListPurchaseOrdersQuery): Promise<unknown[]> {
    if (query.status) {
      return this.purchaseOrders.findByStatus(query.status, query.limit, query.offset);
    }
    if (query.supplierId) {
      return this.purchaseOrders.findBySupplierId(query.supplierId, query.limit, query.offset);
    }
    if (query.warehouseId) {
      return this.purchaseOrders.findByWarehouseId(query.warehouseId, query.limit, query.offset);
    }
    return this.purchaseOrders.findAll(query.limit, query.offset);
  }

  async getPurchaseOrder(id: string): Promise<unknown> {
    return this.purchaseOrders.findById(id);
  }

  async updatePurchaseOrder(id: string, params: Record<string, unknown>): Promise<unknown> {
    return this.purchaseOrders.update(id, params);
  }

  async deletePurchaseOrder(id: string): Promise<boolean> {
    return this.purchaseOrders.delete(id);
  }

  async approvePurchaseOrder(id: string): Promise<unknown> {
    return this.purchaseOrders.approve(id);
  }

  async cancelPurchaseOrder(id: string): Promise<unknown> {
    return this.purchaseOrders.cancel(id);
  }

  async sendPurchaseOrder(id: string): Promise<unknown> {
    return this.purchaseOrders.send(id);
  }

  async getItems(orderId: string): Promise<unknown[]> {
    return this.purchaseOrders.findItemsByOrderId(orderId);
  }

  async addItem(orderId: string, input: CreatePurchaseOrderItemInput): Promise<unknown> {
    const itemParams = {
      supplierPurchaseOrderId: orderId,
      ...input,
      totalCents: input.totalCents ?? (input.quantity ?? 0) * (input.unitCostCents ?? 0),
    };

    const errors: string[] = [];
    if (!itemParams.productId) errors.push('productId is required');
    if (!itemParams.sku) errors.push('sku is required');
    if (!itemParams.name) errors.push('name is required');
    if (!itemParams.quantity || itemParams.quantity <= 0) errors.push('quantity must be greater than 0');
    if (!itemParams.unitCostCents || itemParams.unitCostCents < 0) errors.push('unitCostCents must be non-negative');

    if (errors.length > 0) {
      throw new SupplierValidationError(errors.join('; '));
    }

    return this.purchaseOrders.createItem(itemParams);
  }

  async updateItem(id: string, params: Record<string, unknown>): Promise<unknown> {
    return this.purchaseOrders.updateItem(id, params);
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.purchaseOrders.deleteItem(id);
  }
}
