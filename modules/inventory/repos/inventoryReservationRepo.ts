/**
 * Inventory Reservation Repository
 * 
 * Manages inventory reservations for orders.
 */

import { query, queryOne } from '../../../libs/db';
import { InventoryReservation } from '../../../libs/db/dataModelTypes';

function generateId(): string {
  return `res_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreateReservationParams {
  orderId: string;
  productVariantId: string;
  locationId: string;
  quantity: number;
  expiresAt?: Date;
}

export async function create(params: CreateReservationParams): Promise<InventoryReservation> {
  const reservationId = generateId();
  const now = new Date();

  const sql = `
    INSERT INTO "inventoryReservation" (
      "reservationId", "orderId", "productVariantId", "locationId",
      "quantity", "status", "expiresAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const result = await query<{ rows: InventoryReservation[] }>(sql, [
    reservationId,
    params.orderId,
    params.productVariantId,
    params.locationId,
    params.quantity,
    'reserved',
    params.expiresAt || null,
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(reservationId: string): Promise<InventoryReservation | null> {
  return queryOne<InventoryReservation>(
    'SELECT * FROM "inventoryReservation" WHERE "reservationId" = $1',
    [reservationId]
  );
}

export async function findByOrder(orderId: string): Promise<InventoryReservation[]> {
  const result = await query<{ rows: InventoryReservation[] }>(
    'SELECT * FROM "inventoryReservation" WHERE "orderId" = $1 ORDER BY "createdAt" ASC',
    [orderId]
  );
  return result?.rows ?? [];
}

export async function findByLocation(
  locationId: string,
  productVariantId?: string
): Promise<InventoryReservation[]> {
  let sql = 'SELECT * FROM "inventoryReservation" WHERE "locationId" = $1 AND "status" = \'reserved\'';
  const params: unknown[] = [locationId];

  if (productVariantId) {
    sql += ' AND "productVariantId" = $2';
    params.push(productVariantId);
  }

  const result = await query<{ rows: InventoryReservation[] }>(sql, params);
  return result?.rows ?? [];
}

export async function getReservedQuantity(
  locationId: string,
  productVariantId: string
): Promise<number> {
  const result = await queryOne<{ total: string }>(
    'SELECT COALESCE(SUM("quantity"), 0) as total FROM "inventoryReservation" WHERE "locationId" = $1 AND "productVariantId" = $2 AND "status" = \'reserved\'',
    [locationId, productVariantId]
  );
  return parseInt(result?.total || '0', 10);
}

export async function release(reservationId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "reservationId" = $2 AND "status" = \'reserved\'',
    [new Date(), reservationId]
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function consume(reservationId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "inventoryReservation" SET "status" = \'consumed\', "updatedAt" = $1 WHERE "reservationId" = $2 AND "status" = \'reserved\'',
    [new Date(), reservationId]
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function releaseByOrder(orderId: string): Promise<number> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "orderId" = $2 AND "status" = \'reserved\'',
    [new Date(), orderId]
  );
  return result?.rowCount ?? 0;
}

export async function consumeByOrder(orderId: string): Promise<number> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "inventoryReservation" SET "status" = \'consumed\', "updatedAt" = $1 WHERE "orderId" = $2 AND "status" = \'reserved\'',
    [new Date(), orderId]
  );
  return result?.rowCount ?? 0;
}

export async function releaseExpired(): Promise<number> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "status" = \'reserved\' AND "expiresAt" IS NOT NULL AND "expiresAt" < $1',
    [new Date()]
  );
  return result?.rowCount ?? 0;
}

export default {
  create,
  findById,
  findByOrder,
  findByLocation,
  getReservedQuantity,
  release,
  consume,
  releaseByOrder,
  consumeByOrder,
  releaseExpired,
};
