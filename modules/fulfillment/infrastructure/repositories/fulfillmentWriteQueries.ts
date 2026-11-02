/** Fulfillment + fulfillment-item INSERT/UPDATE statements and row-value builders. */

import { query } from '../../../../libs/db';
import { FulfillmentProps } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';

type FulfillmentItemProps = ReturnType<FulfillmentItem['toPersistence']>;

function isoOrNull(value?: Date): string | null {
  return value?.toISOString() ?? null;
}

function fulfillmentCoreValues(props: FulfillmentProps): Record<string, unknown> {
  return {
    orderId: props.orderId,
    orderNumber: props.orderNumber || null,
    sourceType: props.sourceType,
    sourceId: props.sourceId,
    organizationId: props.organizationId || null,
    supplierId: props.supplierId || null,
    storeId: props.storeId || null,
    channelId: props.channelId || null,
    status: props.status,
  };
}

function fulfillmentCarrierValues(props: FulfillmentProps): Record<string, unknown> {
  return {
    carrierId: props.carrierId || null,
    carrierName: props.carrierName || null,
    shippingMethodId: props.shippingMethodId || null,
    shippingMethodName: props.shippingMethodName || null,
    trackingNumber: props.trackingNumber || null,
    trackingUrl: props.trackingUrl || null,
  };
}

function fulfillmentShippingValues(props: FulfillmentProps): Record<string, unknown> {
  return {
    shipFromAddress: JSON.stringify(props.shipFromAddress),
    shipToAddress: JSON.stringify(props.shipToAddress),
    fulfillmentPartnerId: props.fulfillmentPartnerId || null,
    weightGrams: props.weightGrams || null,
    lengthCm: props.lengthCm || null,
    widthCm: props.widthCm || null,
    heightCm: props.heightCm || null,
    shippingCostCents: props.shippingCostCents || null,
    insuranceCostCents: props.insuranceCostCents || null,
  };
}

function fulfillmentLifecycleValues(props: FulfillmentProps): Record<string, unknown> {
  return {
    notes: props.notes || null,
    internalNotes: props.internalNotes || null,
    assignedAt: isoOrNull(props.assignedAt),
    pickingStartedAt: isoOrNull(props.pickingStartedAt),
    pickedAt: isoOrNull(props.pickedAt),
    packingStartedAt: isoOrNull(props.packingStartedAt),
    packedAt: isoOrNull(props.packedAt),
    shippedAt: isoOrNull(props.shippedAt),
    deliveredAt: isoOrNull(props.deliveredAt),
    cancelledAt: isoOrNull(props.cancelledAt),
    failedAt: isoOrNull(props.failedAt),
    failureReason: props.failureReason || null,
  };
}

function fulfillmentRowValues(props: FulfillmentProps, now: string): Record<string, unknown> {
  return {
    fulfillmentId: props.fulfillmentId,
    createdAt: now,
    updatedAt: now,
    ...fulfillmentCoreValues(props),
    ...fulfillmentCarrierValues(props),
    ...fulfillmentShippingValues(props),
    ...fulfillmentLifecycleValues(props),
  };
}

export async function updateFulfillment(props: FulfillmentProps, now: string): Promise<void> {
  const v = fulfillmentRowValues(props, now);
  await query(
    `UPDATE fulfillment SET
        "orderId" = $1,
        "orderNumber" = $2,
        "sourceType" = $3,
        "sourceId" = $4,
        "organizationId" = $5,
        "supplierId" = $6,
        "storeId" = $7,
        "channelId" = $8,
        status = $9,
        "carrierId" = $10,
        "carrierName" = $11,
        "shippingMethodId" = $12,
        "shippingMethodName" = $13,
        "trackingNumber" = $14,
        "trackingUrl" = $15,
        "shipFromAddress" = $16,
        "shipToAddress" = $17,
        "fulfillmentPartnerId" = $18,
        "weightGrams" = $19,
        "lengthCm" = $20,
        "widthCm" = $21,
        "heightCm" = $22,
        "shippingCostCents" = $23,
        "insuranceCostCents" = $24,
        notes = $25,
        "internalNotes" = $26,
        "assignedAt" = $27,
        "pickingStartedAt" = $28,
        "pickedAt" = $29,
        "packingStartedAt" = $30,
        "packedAt" = $31,
        "shippedAt" = $32,
        "deliveredAt" = $33,
        "cancelledAt" = $34,
        "failedAt" = $35,
        "failureReason" = $36,
        "updatedAt" = $37
      WHERE "fulfillmentId" = $38`,
    [
      v.orderId,
      v.orderNumber,
      v.sourceType,
      v.sourceId,
      v.organizationId,
      v.supplierId,
      v.storeId,
      v.channelId,
      v.status,
      v.carrierId,
      v.carrierName,
      v.shippingMethodId,
      v.shippingMethodName,
      v.trackingNumber,
      v.trackingUrl,
      v.shipFromAddress,
      v.shipToAddress,
      v.fulfillmentPartnerId,
      v.weightGrams,
      v.lengthCm,
      v.widthCm,
      v.heightCm,
      v.shippingCostCents,
      v.insuranceCostCents,
      v.notes,
      v.internalNotes,
      v.assignedAt,
      v.pickingStartedAt,
      v.pickedAt,
      v.packingStartedAt,
      v.packedAt,
      v.shippedAt,
      v.deliveredAt,
      v.cancelledAt,
      v.failedAt,
      v.failureReason,
      v.updatedAt,
      v.fulfillmentId,
    ],
  );
}

export async function insertFulfillment(props: FulfillmentProps, now: string): Promise<void> {
  const v = fulfillmentRowValues(props, now);
  await query(
    `INSERT INTO fulfillment (
        "fulfillmentId", "orderId", "orderNumber", "sourceType", "sourceId",
        "organizationId", "supplierId", "storeId", "channelId", status,
        "carrierId", "carrierName", "shippingMethodId", "shippingMethodName",
        "trackingNumber", "trackingUrl", "shipFromAddress", "shipToAddress",
        "fulfillmentPartnerId", "weightGrams", "lengthCm", "widthCm", "heightCm",
        "shippingCostCents", "insuranceCostCents", notes, "internalNotes",
        "assignedAt", "pickingStartedAt", "pickedAt", "packingStartedAt",
        "packedAt", "shippedAt", "deliveredAt", "cancelledAt", "failedAt",
        "failureReason", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
      )`,
    [
      v.fulfillmentId,
      v.orderId,
      v.orderNumber,
      v.sourceType,
      v.sourceId,
      v.organizationId,
      v.supplierId,
      v.storeId,
      v.channelId,
      v.status,
      v.carrierId,
      v.carrierName,
      v.shippingMethodId,
      v.shippingMethodName,
      v.trackingNumber,
      v.trackingUrl,
      v.shipFromAddress,
      v.shipToAddress,
      v.fulfillmentPartnerId,
      v.weightGrams,
      v.lengthCm,
      v.widthCm,
      v.heightCm,
      v.shippingCostCents,
      v.insuranceCostCents,
      v.notes,
      v.internalNotes,
      v.assignedAt,
      v.pickingStartedAt,
      v.pickedAt,
      v.packingStartedAt,
      v.packedAt,
      v.shippedAt,
      v.deliveredAt,
      v.cancelledAt,
      v.failedAt,
      v.failureReason,
      v.createdAt,
      v.updatedAt,
    ],
  );
}

function itemRowValues(props: FulfillmentItemProps) {
  return {
    quantityOrdered: props.quantityOrdered,
    quantityFulfilled: props.quantityFulfilled,
    quantityPicked: props.quantityPicked || null,
    quantityPacked: props.quantityPacked || null,
    warehouseLocation: props.warehouseLocation || null,
    binLocation: props.binLocation || null,
    serialNumbers: props.serialNumbers ? JSON.stringify(props.serialNumbers) : null,
    lotNumbers: props.lotNumbers ? JSON.stringify(props.lotNumbers) : null,
    isPicked: props.isPicked,
    isPacked: props.isPacked,
    pickedAt: props.pickedAt?.toISOString() || null,
    packedAt: props.packedAt?.toISOString() || null,
  };
}

export async function updateItem(props: FulfillmentItemProps): Promise<void> {
  const now = new Date().toISOString();
  const v = itemRowValues(props);
  await query(
    `UPDATE "fulfillmentItem" SET
        "quantityOrdered" = $1,
        "quantityFulfilled" = $2,
        "quantityPicked" = $3,
        "quantityPacked" = $4,
        "warehouseLocation" = $5,
        "binLocation" = $6,
        "serialNumbers" = $7,
        "lotNumbers" = $8,
        "isPicked" = $9,
        "isPacked" = $10,
        "pickedAt" = $11,
        "packedAt" = $12,
        "updatedAt" = $13
      WHERE "fulfillmentItemId" = $14`,
    [
      v.quantityOrdered,
      v.quantityFulfilled,
      v.quantityPicked,
      v.quantityPacked,
      v.warehouseLocation,
      v.binLocation,
      v.serialNumbers,
      v.lotNumbers,
      v.isPicked,
      v.isPacked,
      v.pickedAt,
      v.packedAt,
      now,
      props.fulfillmentItemId,
    ],
  );
}

export async function insertItem(props: FulfillmentItemProps): Promise<void> {
  const now = new Date().toISOString();
  const v = itemRowValues(props);
  await query(
    `INSERT INTO "fulfillmentItem" (
        "fulfillmentItemId", "fulfillmentId", "orderItemId", "productId",
        "variantId", sku, name, "quantityOrdered", "quantityFulfilled",
        "quantityPicked", "quantityPacked", "warehouseLocation", "binLocation",
        "serialNumbers", "lotNumbers", "isPicked", "isPacked",
        "pickedAt", "packedAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
    [
      props.fulfillmentItemId,
      props.fulfillmentId,
      props.orderItemId,
      props.productId,
      props.variantId || null,
      props.sku,
      props.name,
      v.quantityOrdered,
      v.quantityFulfilled,
      v.quantityPicked,
      v.quantityPacked,
      v.warehouseLocation,
      v.binLocation,
      v.serialNumbers,
      v.lotNumbers,
      v.isPicked,
      v.isPacked,
      v.pickedAt,
      v.packedAt,
      now,
      now,
    ],
  );
}
