/**
 * Inventory Reservation Repository
 *
 * Manages inventory reservations for orders.
 */

import { query, queryOne } from '../../../../libs/db';
import { pool } from '../../../../libs/db/pool';
import { InventoryReservation } from '../../../../libs/db/types';
import { logger } from '../../../../libs/logger';
import crypto from 'crypto';

export interface CreateReservationParams {
  orderId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  expiresAt?: Date;
}

export async function create(params: CreateReservationParams): Promise<InventoryReservation> {
  const reservationId = crypto.randomUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "inventoryReservation" (
      "inventoryReservationId", "inventoryItemId", "productId", "variantId", "sku",
      "orderId", "locationId", "quantity", "status", "expiresAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const result = await queryOne<InventoryReservation>(sql, [
    reservationId,
    params.inventoryItemId,
    params.productId,
    params.variantId || null,
    params.sku || null,
    params.orderId,
    params.locationId,
    params.quantity,
    'reserved',
    params.expiresAt || null,
    now,
    now,
  ]);

  if (!result) {
    throw new Error('Failed to create inventory reservation');
  }

  return result;
}

export async function createAtomic(params: CreateReservationParams): Promise<InventoryReservation | null> {
  const reservationId = crypto.randomUUID();
  const now = new Date();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lockResult = await client.query(
      `SELECT "availableQuantity", "reservedQuantity" FROM "inventoryLocation"
       WHERE "inventoryLocationId" = $1 AND "status" = 'available' FOR UPDATE`,
      [params.locationId],
    );

    if (lockResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const available = parseInt(lockResult.rows[0].availableQuantity, 10);
    if (available < params.quantity) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE "inventoryLocation"
       SET "reservedQuantity" = "reservedQuantity" + $2,
           "availableQuantity" = "availableQuantity" - $2,
           "updatedAt" = $3
       WHERE "inventoryLocationId" = $1`,
      [params.locationId, params.quantity, now],
    );

    const insertResult = await client.query(
      `INSERT INTO "inventoryReservation" (
        "inventoryReservationId", "inventoryItemId", "productId", "variantId", "sku",
        "orderId", "locationId", "quantity", "status", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [reservationId, params.inventoryItemId, params.productId, params.variantId || null, params.sku || null,
       params.orderId, params.locationId, params.quantity, 'reserved', params.expiresAt || null, now, now],
    );

    await client.query('COMMIT');
    return insertResult.rows[0] as InventoryReservation;
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    logger.error(`createAtomic failed: ${(err as Error).message}`);
    throw err;
  } finally {
    client.release();
  }
}

export async function findById(reservationId: string): Promise<InventoryReservation | null> {
  return queryOne<InventoryReservation>('SELECT * FROM "inventoryReservation" WHERE "inventoryReservationId" = $1', [reservationId]);
}

export async function findByOrder(orderId: string): Promise<InventoryReservation[]> {
  const result = await query<InventoryReservation[]>(
    'SELECT * FROM "inventoryReservation" WHERE "orderId" = $1 ORDER BY "createdAt" ASC',
    [orderId],
  );
  return result ?? [];
}

export async function findByLocation(locationId: string, productId?: string, variantId?: string): Promise<InventoryReservation[]> {
  let sql = 'SELECT * FROM "inventoryReservation" WHERE "locationId" = $1 AND "status" = \'reserved\'';
  const params: unknown[] = [locationId];

  if (productId) {
    sql += ' AND "productId" = $2';
    params.push(productId);
  }
  if (variantId) {
    sql += ' AND "variantId" = $3';
    params.push(variantId);
  }

  const result = await query<InventoryReservation[]>(sql, params);
  return result ?? [];
}

export async function getReservedQuantity(locationId: string, productId: string, variantId?: string): Promise<number> {
  let sql = 'SELECT COALESCE(SUM("quantity"), 0) as total FROM "inventoryReservation" WHERE "locationId" = $1 AND "productId" = $2 AND "status" = \'reserved\'';
  const params: unknown[] = [locationId, productId];

  if (variantId) {
    sql += ' AND "variantId" = $3';
    params.push(variantId);
  }

  const result = await queryOne<{ total: string }>(sql, params);
  return parseInt(result?.total || '0', 10);
}

export async function release(inventoryReservationId: string): Promise<boolean> {
  const reservation = await findById(inventoryReservationId);
  if (!reservation || reservation.status !== 'reserved') return false;

  const now = new Date();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE "inventoryLocation"
       SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - $2),
           "availableQuantity" = "availableQuantity" + $2,
           "updatedAt" = $3
       WHERE "inventoryLocationId" = $1`,
      [reservation.locationId, reservation.quantity, now],
    );

    await client.query(
      'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2 AND "status" = \'reserved\'',
      [now, inventoryReservationId],
    );

    await client.query('COMMIT');
    return true;
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    logger.error(`release failed for ${inventoryReservationId}: ${(err as Error).message}`);
    return false;
  } finally {
    client.release();
  }
}

export async function consume(reservationId: string): Promise<boolean> {
  const result = await queryOne<InventoryReservation>(
    'UPDATE "inventoryReservation" SET "status" = \'consumed\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2 AND "status" = \'reserved\' RETURNING *',
    [new Date(), reservationId],
  );
  return result !== null;
}

export async function releaseByOrder(orderId: string): Promise<number> {
  const reservations = await findByOrder(orderId);
  const active = reservations.filter(r => r.status === 'reserved');
  if (active.length === 0) return 0;

  const now = new Date();
  const client = await pool.connect();
  let count = 0;
  try {
    await client.query('BEGIN');

    for (const r of active) {
      await client.query(
        `UPDATE "inventoryLocation"
         SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - $2),
             "availableQuantity" = "availableQuantity" + $2,
             "updatedAt" = $3
         WHERE "inventoryLocationId" = $1`,
        [r.locationId, r.quantity, now],
      );
      await client.query(
        'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2 AND "status" = \'reserved\'',
        [now, r.inventoryReservationId],
      );
      count++;
    }

    await client.query('COMMIT');
    return count;
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    logger.error(`releaseByOrder failed for order ${orderId}: ${(err as Error).message}`);
    return count;
  } finally {
    client.release();
  }
}

export async function consumeByOrder(orderId: string): Promise<number> {
  const result = await query<InventoryReservation[]>(
    'UPDATE "inventoryReservation" SET "status" = \'consumed\', "updatedAt" = $1 WHERE "orderId" = $2 AND "status" = \'reserved\' RETURNING *',
    [new Date(), orderId],
  );
  return result?.length ?? 0;
}

export async function releaseExpired(): Promise<number> {
  const now = new Date();
  const expired = await query<InventoryReservation[]>(
    'SELECT * FROM "inventoryReservation" WHERE "status" = \'reserved\' AND "expiresAt" IS NOT NULL AND "expiresAt" < $1',
    [now],
  );

  if (!expired || expired.length === 0) return 0;

  const client = await pool.connect();
  let count = 0;
  try {
    await client.query('BEGIN');

    for (const r of expired) {
      await client.query(
        `UPDATE "inventoryLocation"
         SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - $2),
             "availableQuantity" = "availableQuantity" + $2,
             "updatedAt" = $3
         WHERE "inventoryLocationId" = $1`,
        [r.locationId, r.quantity, now],
      );
      await client.query(
        'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2',
        [now, r.inventoryReservationId],
      );
      count++;
    }

    await client.query('COMMIT');
    return count;
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    logger.error(`releaseExpired failed: ${(err as Error).message}`);
    return count;
  } finally {
    client.release();
  }
}

export default {
  create,
  createAtomic,
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
