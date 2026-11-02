/**
 * Shipping Label Repository
 * Manages shipping label data with CRUD operations
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { FailedToCreateShippingEntityError } from '../../domain/errors/ShippingErrors';
import type { ShippingLabel, CreateShippingLabelInput } from '../../domain/repositories/ShippingLabelRepository';
import type { ShippingLabel as DbShippingLabel } from '../../../../libs/db/types';

// Null → undefined / default coercion kept out of row mapping to keep complexity low.
function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}
function nvl<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}
// `||`-style defaulting for insert params.
function fallback<T>(value: T | undefined | null, defaultValue: T): T {
  return value || defaultValue;
}

function rowToLabel(row: DbShippingLabel): ShippingLabel {
  return {
    shippingLabelId: row.shippingLabelId,
    shippingCarrierId: row.shippingCarrierId,
    carrierName: opt(row.carrierName),
    carrierService: opt(row.carrierService),
    trackingNumber: row.trackingNumber,
    labelUrl: opt(row.labelUrl),
    labelFormat: nvl(row.labelFormat, 'PDF'),
    status: nvl(row.status, 'created'),
    orderId: opt(row.orderId),
    fulfillmentId: opt(row.fulfillmentId),
    shipFromName: opt(row.shipFromName),
    shipToName: opt(row.shipToName),
    shipToAddressLine1: opt(row.shipToAddressLine1),
    shipToCity: opt(row.shipToCity),
    shipToState: opt(row.shipToState),
    shipToPostalCode: opt(row.shipToPostalCode),
    shipToCountry: opt(row.shipToCountry),
    weight: row.weight != null ? Number(row.weight) : undefined,
    dimensions: opt(row.dimensions) as Record<string, unknown> | undefined,
    shippingCost: opt(row.shippingCostCents),
    voidReason: opt(row.voidReason),
    voidedAt: opt(row.voidedAt),
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  };
}

function labelInsertValues(id: string, input: CreateShippingLabelInput, now: Date): unknown[] {
  return [
    id,
    input.shippingCarrierId,
    fallback(input.carrierName, null),
    fallback(input.carrierService, null),
    input.trackingNumber,
    fallback(input.labelUrl, null),
    fallback(input.labelFormat, 'PDF'),
    'created',
    fallback(input.orderId, null),
    fallback(input.fulfillmentId, null),
    fallback(input.shipFromName, null),
    fallback(input.shipToName, null),
    fallback(input.shipToAddressLine1, null),
    fallback(input.shipToCity, null),
    fallback(input.shipToState, null),
    fallback(input.shipToPostalCode, null),
    fallback(input.shipToCountry, null),
    fallback(input.weight, null),
    input.dimensions ? JSON.stringify(input.dimensions) : null,
    fallback(input.shippingCost, null),
    now,
    now,
  ];
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

  const result = await query<DbShippingLabel[]>(sql, labelInsertValues(id, input, now));

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
