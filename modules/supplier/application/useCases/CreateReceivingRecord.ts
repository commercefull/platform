/**
 * CreateReceivingRecord Use Case
 *
 * Creates a receiving record header and its receiving items.
 */

import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

export interface ReceivingItemInput {
  productId: string;
  sku: string;
  name: string;
  receivedQuantity: number;
  supplierPurchaseOrderItemId?: string;
  productVariantId?: string;
  expectedQuantity?: number;
  rejectedQuantity?: number;
  distributionWarehouseBinId?: string;
  lotNumber?: string;
  serialNumbers?: string[];
  expiryDate?: string;
  status?: string;
  acceptanceStatus?: string;
  inspectionNotes?: string;
  discrepancyReason?: string;
  processedAt?: string;
  processedBy?: string;
}

export interface CreateReceivingRecordInput {
  distributionWarehouseId: string;
  supplierId: string;
  items: ReceivingItemInput[];
  supplierPurchaseOrderId?: string;
  status?: string;
  receivedDate?: string;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  discrepancies?: boolean;
  attachments?: Record<string, unknown>;
}

export interface ReceivingRecordResult {
  supplierReceivingRecordId: string;
}
export interface ReceivingItemResult {
  supplierReceivingItemId: string;
}

export interface ReceivingRecordWritePort {
  create(params: Record<string, unknown>): Promise<ReceivingRecordResult>;
}

export interface ReceivingItemWritePort {
  create(params: Record<string, unknown>): Promise<ReceivingItemResult>;
}

export class CreateReceivingRecordUseCase {
  constructor(
    private readonly receivingRecordRepo: ReceivingRecordWritePort,
    private readonly receivingItemRepo: ReceivingItemWritePort,
  ) {}

  async execute(input: CreateReceivingRecordInput): Promise<{ receivingRecord: ReceivingRecordResult; items: ReceivingItemResult[] }> {
    const errors: string[] = [];
    if (!input.distributionWarehouseId) errors.push('distributionWarehouseId is required');
    if (!input.supplierId) errors.push('supplierId is required');
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      errors.push('items array is required and must not be empty');
    }
    if (errors.length > 0) {
      throw new SupplierValidationError(errors.join('; '));
    }

    const receivingRecord = await this.receivingRecordRepo.create({
      supplierPurchaseOrderId: input.supplierPurchaseOrderId,
      distributionWarehouseId: input.distributionWarehouseId,
      supplierId: input.supplierId,
      status: input.status,
      receivedDate: input.receivedDate,
      carrierName: input.carrierName,
      trackingNumber: input.trackingNumber,
      packageCount: input.packageCount,
      notes: input.notes,
      discrepancies: input.discrepancies,
      attachments: input.attachments,
    });

    const createdItems: ReceivingItemResult[] = [];
    for (const item of input.items) {
      const createdItem = await this.receivingItemRepo.create({
        ...item,
        supplierReceivingRecordId: receivingRecord.supplierReceivingRecordId,
      });
      createdItems.push(createdItem);
    }

    return { receivingRecord, items: createdItems };
  }
}
