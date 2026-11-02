/** Map fulfillment / fulfillmentItem database rows to domain entities. */

import { Fulfillment as DbFulfillment, FulfillmentItem as DbFulfillmentItem } from '../../../../libs/db/types';
import { Fulfillment, FulfillmentStatus, SourceType } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';

function parseJson<T>(value: unknown, defaultValue: T): T {
  if (!value) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}

function fulfillmentIdentityFromRow(row: DbFulfillment) {
  return {
    fulfillmentId: row.fulfillmentId,
    orderId: row.orderId,
    orderNumber: row.orderNumber ?? undefined,
    sourceType: row.sourceType as SourceType,
    sourceId: row.sourceId,
    organizationId: row.organizationId ?? undefined,
    supplierId: row.supplierId ?? undefined,
    storeId: row.storeId ?? undefined,
    channelId: row.channelId ?? undefined,
    status: row.status as FulfillmentStatus,
    fulfillmentPartnerId: row.fulfillmentPartnerId ?? undefined,
  };
}

function fulfillmentCarrierFromRow(row: DbFulfillment) {
  const emptyAddress = { addressLine1: '', city: '', postalCode: '', countryCode: '' };
  return {
    carrierId: row.carrierId ?? undefined,
    carrierName: row.carrierName ?? undefined,
    shippingMethodId: row.shippingMethodId ?? undefined,
    shippingMethodName: row.shippingMethodName ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    trackingUrl: row.trackingUrl ?? undefined,
    shipFromAddress: parseJson(row.shipFromAddress, emptyAddress),
    shipToAddress: parseJson(row.shipToAddress, emptyAddress),
  };
}

function fulfillmentParcelFromRow(row: DbFulfillment) {
  return {
    weightGrams: row.weightGrams ?? undefined,
    lengthCm: row.lengthCm ?? undefined,
    widthCm: row.widthCm ?? undefined,
    heightCm: row.heightCm ?? undefined,
    shippingCostCents: row.shippingCostCents != null ? Number(row.shippingCostCents) : undefined,
    insuranceCostCents: row.insuranceCostCents != null ? Number(row.insuranceCostCents) : undefined,
    notes: row.notes ?? undefined,
    internalNotes: row.internalNotes ?? undefined,
    failureReason: row.failureReason ?? undefined,
  };
}

function fulfillmentDatesFromRow(row: DbFulfillment) {
  return {
    assignedAt: row.assignedAt ? new Date(row.assignedAt) : undefined,
    pickingStartedAt: row.pickingStartedAt ? new Date(row.pickingStartedAt) : undefined,
    pickedAt: row.pickedAt ? new Date(row.pickedAt) : undefined,
    packingStartedAt: row.packingStartedAt ? new Date(row.packingStartedAt) : undefined,
    packedAt: row.packedAt ? new Date(row.packedAt) : undefined,
    shippedAt: row.shippedAt ? new Date(row.shippedAt) : undefined,
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
    cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
    failedAt: row.failedAt ? new Date(row.failedAt) : undefined,
  };
}

export function mapToFulfillment(row: DbFulfillment): Fulfillment {
  return Fulfillment.fromPersistence({
    ...fulfillmentIdentityFromRow(row),
    ...fulfillmentCarrierFromRow(row),
    ...fulfillmentParcelFromRow(row),
    ...fulfillmentDatesFromRow(row),
    createdAt: new Date(row.createdAt ?? new Date()),
    updatedAt: new Date(row.updatedAt ?? new Date()),
  });
}

export function mapToFulfillmentItem(row: DbFulfillmentItem): FulfillmentItem {
  return FulfillmentItem.fromPersistence({
    fulfillmentItemId: row.fulfillmentItemId,
    fulfillmentId: row.fulfillmentId,
    orderItemId: row.orderItemId,
    productId: row.productId,
    variantId: row.variantId ?? undefined,
    sku: row.sku,
    name: row.name,
    quantityOrdered: row.quantityOrdered,
    quantityFulfilled: row.quantityFulfilled ?? 0,
    quantityPicked: row.quantityPicked ?? undefined,
    quantityPacked: row.quantityPacked ?? undefined,
    warehouseLocation: row.warehouseLocation ?? undefined,
    binLocation: row.binLocation ?? undefined,
    serialNumbers: parseJson(row.serialNumbers, undefined),
    lotNumbers: parseJson(row.lotNumbers, undefined),
    isPicked: Boolean(row.isPicked),
    isPacked: Boolean(row.isPacked),
    pickedAt: row.pickedAt ? new Date(row.pickedAt) : undefined,
    packedAt: row.packedAt ? new Date(row.packedAt) : undefined,
    createdAt: new Date(row.createdAt ?? new Date()),
    updatedAt: new Date(row.updatedAt ?? new Date()),
  });
}
