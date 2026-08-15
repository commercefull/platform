/**
 * Shipping Label Repository
 * Manages shipping label data with CRUD operations
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';

export interface ShippingLabel {
  shippingLabelId: string;
  shippingCarrierId: string;
  carrierName?: string;
  carrierService?: string;
  trackingNumber: string;
  labelUrl?: string;
  labelFormat: string;
  status: string;
  orderId?: string;
  fulfillmentId?: string;
  shipFromName?: string;
  shipToName?: string;
  shipToAddressLine1?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToPostalCode?: string;
  shipToCountry?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shippingCost?: number;
  voidReason?: string;
  voidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShippingLabelInput {
  shippingCarrierId: string;
  carrierName?: string;
  carrierService?: string;
  trackingNumber: string;
  labelUrl?: string;
  labelFormat?: string;
  orderId?: string;
  fulfillmentId?: string;
  shipFromName?: string;
  shipToName?: string;
  shipToAddressLine1?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToPostalCode?: string;
  shipToCountry?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shippingCost?: number;
}

export async function create(input: CreateShippingLabelInput): Promise<ShippingLabel> {
  const id = generateUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "shippingLabel" (
      "shippingLabelId", "shippingCarrierId", "carrierName", "carrierService",
      "trackingNumber", "labelUrl", "labelFormat", "status",
      "orderId", "fulfillmentId", "shipFromName", "shipToName",
      "shipToAddressLine1", "shipToCity", "shipToState", "shipToPostalCode", "shipToCountry",
      "weight", "dimensions", "shippingCost", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *
  `;

  const result = await query<ShippingLabel[]>(sql, [
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
    throw new Error('Failed to create shipping label');
  }
  return result[0];
}

export async function findById(shippingLabelId: string): Promise<ShippingLabel | null> {
  return queryOne<ShippingLabel>('SELECT * FROM "shippingLabel" WHERE "shippingLabelId" = $1', [shippingLabelId]);
}

export async function findByTrackingNumber(trackingNumber: string): Promise<ShippingLabel | null> {
  return queryOne<ShippingLabel>('SELECT * FROM "shippingLabel" WHERE "trackingNumber" = $1', [trackingNumber]);
}

export async function findByOrderId(orderId: string): Promise<ShippingLabel[]> {
  const result = await query<ShippingLabel[]>('SELECT * FROM "shippingLabel" WHERE "orderId" = $1 ORDER BY "createdAt" DESC', [orderId]);
  return result || [];
}

export async function findByFulfillmentId(fulfillmentId: string): Promise<ShippingLabel[]> {
  const result = await query<ShippingLabel[]>('SELECT * FROM "shippingLabel" WHERE "fulfillmentId" = $1 ORDER BY "createdAt" DESC', [fulfillmentId]);
  return result || [];
}

export async function voidLabel(shippingLabelId: string, reason?: string): Promise<ShippingLabel | null> {
  const now = new Date();
  return queryOne<ShippingLabel>(
    `UPDATE "shippingLabel" SET "status" = 'voided', "voidReason" = $1, "voidedAt" = $2, "updatedAt" = $3 WHERE "shippingLabelId" = $4 AND "status" = 'created' RETURNING *`,
    [reason || null, now, now, shippingLabelId],
  );
}

export async function findAll(limit = 50, offset = 0): Promise<ShippingLabel[]> {
  const result = await query<ShippingLabel[]>('SELECT * FROM "shippingLabel" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2', [limit, offset]);
  return result || [];
}

export default { create, findById, findByTrackingNumber, findByOrderId, findByFulfillmentId, voidLabel, findAll };
