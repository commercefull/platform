/**
 * Inventory Reservation Repository
 *
 * Manages inventory reservations for orders.
 */

import { query, queryOne, withTransaction } from '../../../../libs/db';
import { InventoryReservation } from '../../../../libs/db/types';
import { logger } from '../../../../libs/logger';
import crypto from 'crypto';
import { FailedToCreateInventoryError } from '../../domain/errors/InventoryErrors';

interface CreateReservationParams {
  orderId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  expiresAt?: Date;
}

async function create(params: CreateReservationParams): Promise<InventoryReservation> {
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
    throw new FailedToCreateInventoryError('Failed to create inventory reservation');
  }

  return result;
}

async function createAtomic(params: CreateReservationParams): Promise<InventoryReservation | null> {
  const reservationId = crypto.randomUUID();
  const now = new Date();

  try {
    return await withTransaction(async tx => {
      const lockRow = await tx.queryOne<{ availableQuantity: string }>(
        `SELECT "availableQuantity", "reservedQuantity" FROM "inventoryLocation"
         WHERE "inventoryLocationId" = $1 AND "status" = 'available' FOR UPDATE`,
        [params.locationId],
      );

      if (!lockRow) {
        return null;
      }

      const available = parseInt(lockRow.availableQuantity, 10);
      if (available < params.quantity) {
        return null;
      }

      await tx.query(
        `UPDATE "inventoryLocation"
         SET "reservedQuantity" = "reservedQuantity" + $2,
             "availableQuantity" = "availableQuantity" - $2,
             "updatedAt" = $3
         WHERE "inventoryLocationId" = $1`,
        [params.locationId, params.quantity, now],
      );

      return tx.queryOne<InventoryReservation>(
        `INSERT INTO "inventoryReservation" (
          "inventoryReservationId", "inventoryItemId", "productId", "variantId", "sku",
          "orderId", "locationId", "quantity", "status", "expiresAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
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
        ],
      );
    });
  } catch (err: unknown) {
    logger.warn(`createAtomic failed: ${(err as Error).message}`);
    throw err;
  }
}

async function findById(reservationId: string): Promise<InventoryReservation | null> {
  return queryOne<InventoryReservation>('SELECT * FROM "inventoryReservation" WHERE "inventoryReservationId" = $1', [reservationId]);
}

async function findByOrder(orderId: string): Promise<InventoryReservation[]> {
  const result = await query<InventoryReservation[]>('SELECT * FROM "inventoryReservation" WHERE "orderId" = $1 ORDER BY "createdAt" ASC', [
    orderId,
  ]);
  return result ?? [];
}

async function findByLocation(locationId: string, productId?: string, variantId?: string): Promise<InventoryReservation[]> {
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

async function getReservedQuantity(locationId: string, productId: string, variantId?: string): Promise<number> {
  let sql =
    'SELECT COALESCE(SUM("quantity"), 0) as total FROM "inventoryReservation" WHERE "locationId" = $1 AND "productId" = $2 AND "status" = \'reserved\'';
  const params: unknown[] = [locationId, productId];

  if (variantId) {
    sql += ' AND "variantId" = $3';
    params.push(variantId);
  }

  const result = await queryOne<{ total: string }>(sql, params);
  return parseInt(result?.total || '0', 10);
}

async function release(inventoryReservationId: string): Promise<boolean> {
  const reservation = await findById(inventoryReservationId);
  if (!reservation || reservation.status !== 'reserved') return false;

  const now = new Date();
  try {
    return await withTransaction(async tx => {
      await tx.query(
        `UPDATE "inventoryLocation"
         SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - $2),
             "availableQuantity" = "availableQuantity" + $2,
             "updatedAt" = $3
         WHERE "inventoryLocationId" = $1`,
        [reservation.locationId, reservation.quantity, now],
      );

      await tx.query(
        'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2 AND "status" = \'reserved\'',
        [now, inventoryReservationId],
      );

      return true;
    });
  } catch (err: unknown) {
    logger.warn(`release failed for ${inventoryReservationId}: ${(err as Error).message}`);
    return false;
  }
}

async function consume(reservationId: string): Promise<boolean> {
  const result = await queryOne<InventoryReservation>(
    'UPDATE "inventoryReservation" SET "status" = \'consumed\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2 AND "status" = \'reserved\' RETURNING *',
    [new Date(), reservationId],
  );
  return result !== null;
}

async function releaseByOrder(orderId: string): Promise<number> {
  const reservations = await findByOrder(orderId);
  const active = reservations.filter(r => r.status === 'reserved');
  if (active.length === 0) return 0;

  const now = new Date();
  let count = 0;
  try {
    return await withTransaction(async tx => {
      for (const r of active) {
        await tx.query(
          `UPDATE "inventoryLocation"
           SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - $2),
               "availableQuantity" = "availableQuantity" + $2,
               "updatedAt" = $3
           WHERE "inventoryLocationId" = $1`,
          [r.locationId, r.quantity, now],
        );
        await tx.query(
          'UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2 AND "status" = \'reserved\'',
          [now, r.inventoryReservationId],
        );
        count++;
      }

      return count;
    });
  } catch (err: unknown) {
    logger.warn(`releaseByOrder failed for order ${orderId}: ${(err as Error).message}`);
    return count;
  }
}

async function consumeByOrder(orderId: string): Promise<number> {
  // Finalize all live holds: 'reserved' (event-path), 'active' (checkout
  // orchestration), and 'confirmed' (post-payment allocations).
  const result = await query<InventoryReservation[]>(
    'UPDATE "inventoryReservation" SET "status" = \'consumed\', "updatedAt" = $1 WHERE "orderId" = $2 AND "status" IN (\'reserved\', \'active\', \'confirmed\') RETURNING *',
    [new Date(), orderId],
  );
  return result?.length ?? 0;
}

export async function releaseExpired(): Promise<number> {
  const now = new Date();
  const expired = await query<InventoryReservation[]>(
    'SELECT * FROM "inventoryReservation" WHERE "status" IN (\'reserved\', \'active\') AND "expiresAt" IS NOT NULL AND "expiresAt" < $1',
    [now],
  );

  if (!expired || expired.length === 0) return 0;

  let count = 0;
  try {
    return await withTransaction(async tx => {
      for (const r of expired) {
        // 'active' rows (checkout path) store the inventoryLocationId in
        // inventoryItemId; 'reserved' rows (event path) store it in locationId.
        const locationKey = r.status === 'active' ? r.inventoryItemId : r.locationId;
        await tx.query(
          `UPDATE "inventoryLocation"
           SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - $2),
               "availableQuantity" = "availableQuantity" + $2,
               "updatedAt" = $3
           WHERE "inventoryLocationId" = $1`,
          [locationKey, r.quantity, now],
        );
        await tx.query('UPDATE "inventoryReservation" SET "status" = \'released\', "updatedAt" = $1 WHERE "inventoryReservationId" = $2', [
          now,
          r.inventoryReservationId,
        ]);
        count++;
      }

      return count;
    });
  } catch (err: unknown) {
    logger.warn(`releaseExpired failed: ${(err as Error).message}`);
    return count;
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
