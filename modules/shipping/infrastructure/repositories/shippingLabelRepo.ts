/**
 * Shipping Label Repository
 * Manages shipping label data with CRUD operations
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { FailedToCreateShippingEntityError } from '../../domain/errors/ShippingErrors';
import type { ShippingLabel, CreateShippingLabelInput } from '../../domain/repositories/ShippingLabelRepository';
import type { ShippingLabel as DbShippingLabel } from '../../../../libs/db/types';

function rowToLabel(row: DbShippingLabel): ShippingLabel {
  return {
    shippingLabelId: row.shippingLabelId,
    shippingCarrierId: row.shippingCarrierId,
    carrierName: row.carrierName ?? undefined,
    carrierService: row.carrierService ?? undefined,
    trackingNumber: row.trackingNumber,
    labelUrl: row.labelUrl ?? undefined,
    labelFormat: row.labelFormat ?? 'PDF',
    status: row.status ?? 'created',
    orderId: row.orderId ?? undefined,
    fulfillmentId: row.fulfillmentId ?? undefined,
    shipFromName: row.shipFromName ?? undefined,
    shipToName: row.shipToName ?? undefined,
    shipToAddressLine1: row.shipToAddressLine1 ?? undefined,
    shipToCity: row.shipToCity ?? undefined,
    shipToState: row.shipToState ?? undefined,
    shipToPostalCode: row.shipToPostalCode ?? undefined,
    shipToCountry: row.shipToCountry ?? undefined,
    weight: row.weight != null ? Number(row.weight) : undefined,
    dimensions: (row.dimensions ?? undefined) as Record<string, unknown> | undefined,
    shippingCost: row.shippingCostCents ?? undefined,
    voidReason: row.voidReason ?? undefined,
    voidedAt: row.voidedAt ?? undefined,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  };
}

async function create(input: CreateShippingLabelInput): Promise<ShippingLabel> {
  const id = generateUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "shippingLabel" (
      "shippingLabelId", "shippingCarrierId", "carrierName", "carrierService",
      "trackingNumber", "labelUrl", "labelFormat", "status",
      "orderId", "fulfillmentId", "shipFromName", "shipToName",
      "shipToAddressLine1", "shipToCity", "shipToState", "shipToPostalCode", "shipToCountry",
      "weight", "dimensions", "shippingCostCents", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *
  `;

  const result = await query<DbShippingLabel[]>(sql, [
    id,
    input.shippingCarrierId,
    input.carrierName || null,
    input.carrierService || null,
    input.trackingNumber,
    input.labelUrl || null,
    input.labelFormat || 'PDF',
    'created',
    input.orderId || null,
    input.fulfillmentId || null,
    input.shipFromName || null,
    input.shipToName || null,
    input.shipToAddressLine1 || null,
    input.shipToCity || null,
    input.shipToState || null,
    input.shipToPostalCode || null,
    input.shipToCountry || null,
    input.weight || null,
    input.dimensions ? JSON.stringify(input.dimensions) : null,
    input.shippingCost || null,
    now,
    now,
  ]);

  if (!result || result.length === 0) {
    throw new FailedToCreateShippingEntityError('Failed to create shipping label');
  }
  return rowToLabel(result[0]);
}

async function findById(shippingLabelId: string): Promise<ShippingLabel | null> {
  const row = await queryOne<DbShippingLabel>('SELECT * FROM "shippingLabel" WHERE "shippingLabelId" = $1', [shippingLabelId]);
  return row ? rowToLabel(row) : null;
}

async function findByTrackingNumber(trackingNumber: string): Promise<ShippingLabel | null> {
  const row = await queryOne<DbShippingLabel>('SELECT * FROM "shippingLabel" WHERE "trackingNumber" = $1', [trackingNumber]);
  return row ? rowToLabel(row) : null;
}

async function findByOrderId(orderId: string): Promise<ShippingLabel[]> {
  const result = await query<DbShippingLabel[]>('SELECT * FROM "shippingLabel" WHERE "orderId" = $1 ORDER BY "createdAt" DESC', [orderId]);
  return (result || []).map(rowToLabel);
}

async function findByFulfillmentId(fulfillmentId: string): Promise<ShippingLabel[]> {
  const result = await query<DbShippingLabel[]>('SELECT * FROM "shippingLabel" WHERE "fulfillmentId" = $1 ORDER BY "createdAt" DESC', [
    fulfillmentId,
  ]);
  return (result || []).map(rowToLabel);
}

async function voidLabel(shippingLabelId: string, reason?: string): Promise<ShippingLabel | null> {
  const now = new Date();
  const row = await queryOne<DbShippingLabel>(
    `UPDATE "shippingLabel" SET "status" = 'voided', "voidReason" = $1, "voidedAt" = $2, "updatedAt" = $3 WHERE "shippingLabelId" = $4 AND "status" = 'created' RETURNING *`,
    [reason || null, now, now, shippingLabelId],
  );
  return row ? rowToLabel(row) : null;
}

async function findAll(limit = 50, offset = 0): Promise<ShippingLabel[]> {
  const result = await query<DbShippingLabel[]>('SELECT * FROM "shippingLabel" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2', [
    limit,
    offset,
  ]);
  return (result || []).map(rowToLabel);
}

export default { create, findById, findByTrackingNumber, findByOrderId, findByFulfillmentId, voidLabel, findAll };
