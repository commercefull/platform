/**
 * CreatePurchaseOrder Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface PurchaseOrderItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  items: PurchaseOrderItem[];
  expectedDeliveryDate?: Date;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
}

export interface CreatePurchaseOrderOutput {
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly supplierRepository: any,
    private readonly purchaseOrderRepository: any,
  ) {}

  async execute(input: CreatePurchaseOrderInput): Promise<CreatePurchaseOrderOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new Error(`Supplier not found: ${input.supplierId}`);
    }

    if (supplier.status !== 'approved' || !supplier.isActive) {
      throw new Error('Supplier is not active');
    }

    // Calculate total
    const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    // Check minimum order value
    if (supplier.minimumOrderValue && totalAmount < supplier.minimumOrderValue) {
      throw new Error(`Order total ${totalAmount} is below minimum ${supplier.minimumOrderValue}`);
    }

    const purchaseOrderId = `po_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const poNumber = `PO-${Date.now().toString().slice(-8)}`;

    const expectedDelivery = input.expectedDeliveryDate || new Date(Date.now() + (supplier.leadTimeDays || 7) * 24 * 60 * 60 * 1000);

    const purchaseOrder = await this.purchaseOrderRepository.create({
      purchaseOrderId,
      poNumber,
      supplierId: input.supplierId,
      items: input.items,
      totalAmount,
      status: 'draft',
      expectedDeliveryDate: expectedDelivery,
      shippingAddress: input.shippingAddress,
      notes: input.notes,
    });

    eventBus.emit('purchase_order.created', {
      purchaseOrderId,
      supplierId: input.supplierId,
      totalAmount,
    });

    return {
      purchaseOrderId: purchaseOrder.purchaseOrderId,
      poNumber: purchaseOrder.poNumber,
      supplierId: purchaseOrder.supplierId,
      totalAmount: purchaseOrder.totalAmount,
      status: purchaseOrder.status,
      createdAt: purchaseOrder.createdAt.toISOString(),
    };
  }
}
