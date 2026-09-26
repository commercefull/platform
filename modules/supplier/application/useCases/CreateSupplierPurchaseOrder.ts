/**
 * CreateSupplierPurchaseOrder Use Case
 *
 * Creates a purchase order header and its line items. Validates that the
 * supplier exists and that at least one item is provided.
 */

import { SupplierNotFoundError, SupplierValidationError } from '../../domain/errors/SupplierErrors';

export interface SupplierPurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitCostCents: number;
  totalCents?: number;
  supplierProductId?: string;
  productVariantId?: string;
  sku?: string;
  supplierSku?: string;
  name?: string;
  description?: string;
  receivedQuantity?: number;
  taxCents?: number;
  discountCents?: number;
  status?: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface CreateSupplierPurchaseOrderInput {
  supplierId: string;
  distributionWarehouseId: string;
  items: SupplierPurchaseOrderItemInput[];
  status?: string;
  orderType?: string;
  priority?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  carrierName?: string;
  paymentTerms?: string;
  currency?: string;
  subtotalCents?: number;
  taxCents?: number;
  shippingCents?: number;
  discountCents?: number;
  totalCents?: number;
  notes?: string;
  supplierNotes?: string;
  attachments?: Record<string, unknown>;
}

export interface PurchaseOrderRecord {
  supplierPurchaseOrderId: string;
}
export interface PurchaseOrderItemRecord {
  supplierPurchaseOrderItemId: string;
}

export interface SupplierLookupPort {
  findById(id: string): Promise<unknown>;
}

export interface SupplierPurchaseOrderWritePort {
  create(params: Record<string, unknown>): Promise<PurchaseOrderRecord>;
  createItem(params: Record<string, unknown>): Promise<PurchaseOrderItemRecord>;
}

export class CreateSupplierPurchaseOrderUseCase {
  constructor(
    private readonly supplierRepository: SupplierLookupPort,
    private readonly purchaseOrderRepository: SupplierPurchaseOrderWritePort,
  ) {}

  async execute(input: CreateSupplierPurchaseOrderInput): Promise<{ purchaseOrder: PurchaseOrderRecord; items: PurchaseOrderItemRecord[] }> {
    const errors: string[] = [];
    if (!input.supplierId) errors.push('supplierId is required');
    if (!input.distributionWarehouseId) errors.push('distributionWarehouseId is required');
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      errors.push('items array is required and must not be empty');
    }
    if (errors.length > 0) {
      throw new SupplierValidationError(errors.join('; '));
    }

    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new SupplierNotFoundError(input.supplierId);
    }

    const purchaseOrder = await this.purchaseOrderRepository.create({
      supplierId: input.supplierId,
      distributionWarehouseId: input.distributionWarehouseId,
      status: input.status,
      orderType: input.orderType,
      priority: input.priority,
      orderDate: input.orderDate,
      expectedDeliveryDate: input.expectedDeliveryDate,
      deliveryDate: input.deliveryDate,
      shippingMethod: input.shippingMethod,
      trackingNumber: input.trackingNumber,
      carrierName: input.carrierName,
      paymentTerms: input.paymentTerms,
      currencyCode: input.currency || 'USD',
      subtotalCents: input.subtotalCents,
      taxCents: input.taxCents,
      shippingCents: input.shippingCents,
      discountCents: input.discountCents,
      totalCents: input.totalCents,
      notes: input.notes,
      supplierNotes: input.supplierNotes,
      attachments: input.attachments,
    });

    const createdItems: PurchaseOrderItemRecord[] = [];
    for (const item of input.items) {
      const createdItem = await this.purchaseOrderRepository.createItem({
        ...item,
        totalCents: item.totalCents ?? item.quantity * item.unitCostCents,
        supplierPurchaseOrderId: purchaseOrder.supplierPurchaseOrderId,
      });
      createdItems.push(createdItem);
    }

    return { purchaseOrder, items: createdItems };
  }
}
