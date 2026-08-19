/**
 * Inventory Pool Repository
 *
 * Manages shared inventory pools for multi-store businesses.
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import {
  InventoryPool as DbInventoryPool,
  InventoryPoolLocation as DbInventoryPoolLocation,
  InventoryLocation as _DbInventoryLocation,
} from '../../../../libs/db/types';

export interface InventoryPool {
  poolId: string;
  ownerType: 'organization';
  ownerId: string;
  name: string;
  poolType: 'shared' | 'virtual' | 'aggregated';
  linkedInventoryIds: string[];
  allocationStrategy: 'fifo' | 'nearest' | 'even_split' | 'priority';
  reservationPolicy: 'immediate' | 'deferred';
  isActive: boolean;
  createdAt: Date;
}

export interface PoolLocation {
  inventoryId: string;
  locationId: string;
  availableQuantity: number;
  priority: number;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export interface AllocationResultItem {
  productId: string;
  variantId?: string;
  allocations: Array<{
    locationId: string;
    quantity: number;
  }>;
}

export async function createPool(input: {
  poolId: string;
  ownerType: 'organization';
  ownerId: string;
  name: string;
  poolType: 'shared' | 'virtual' | 'aggregated';
  linkedInventoryIds: string[];
  allocationStrategy: 'fifo' | 'nearest' | 'even_split' | 'priority';
  reservationPolicy: 'immediate' | 'deferred';
  isActive: boolean;
}): Promise<InventoryPool> {
  const now = new Date().toISOString();

  await query(
    `INSERT INTO "inventoryPool" (
      "inventoryPoolId", "ownerType", "ownerId", name, "poolType",
      "allocationStrategy", "reservationPolicy", "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      input.poolId,
      input.ownerType,
      input.ownerId,
      input.name,
      input.poolType,
      input.allocationStrategy,
      input.reservationPolicy,
      input.isActive,
      now,
      now,
    ],
  );

  for (const locationId of input.linkedInventoryIds) {
    const linkId = generateUUID();
    await query(
      `INSERT INTO "inventoryPoolLocation" (
        "inventoryPoolLocationId", "inventoryPoolId", "locationType", "locationId", "priority", "isActive", "createdAt"
      ) VALUES ($1, $2, 'warehouse', $3, 0, true, $4)`,
      [linkId, input.poolId, locationId, now],
    );
  }

  return {
    poolId: input.poolId,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    name: input.name,
    poolType: input.poolType,
    linkedInventoryIds: input.linkedInventoryIds,
    allocationStrategy: input.allocationStrategy,
    reservationPolicy: input.reservationPolicy,
    isActive: input.isActive,
    createdAt: new Date(now),
  };
}

export async function findPoolById(poolId: string): Promise<InventoryPool | null> {
  const row = await queryOne<DbInventoryPool>(
    'SELECT * FROM "inventoryPool" WHERE "inventoryPoolId" = $1',
    [poolId],
  );
  if (!row) return null;

  const locationRows = await query<DbInventoryPoolLocation[]>(
    'SELECT "locationId" FROM "inventoryPoolLocation" WHERE "inventoryPoolId" = $1 AND "isActive" = true',
    [poolId],
  );

  return {
    poolId: row.inventoryPoolId,
    ownerType: row.ownerType as 'organization',
    ownerId: row.ownerId,
    name: row.name,
    poolType: row.poolType as 'shared' | 'virtual' | 'aggregated',
    linkedInventoryIds: (locationRows || []).map((r: DbInventoryPoolLocation) => r.locationId),
    allocationStrategy: (row.allocationStrategy ?? 'fifo') as 'fifo' | 'nearest' | 'even_split' | 'priority',
    reservationPolicy: (row.reservationPolicy ?? 'immediate') as 'immediate' | 'deferred',
    isActive: row.isActive ?? true,
    createdAt: new Date(row.createdAt ?? Date.now()),
  };
}

interface PoolInventoryRow {
  inventoryId: string;
  locationId: string;
  availableQuantity: number;
  priority: number;
  createdAt: string;
}

export async function findAvailableInPool(
  poolId: string,
  productId: string,
  variantId?: string,
): Promise<PoolLocation[]> {
  const rows = await query<PoolInventoryRow[]>(
    `SELECT i."inventoryLocationId" as "inventoryId", i."distributionWarehouseId" as "locationId",
            i."availableQuantity", COALESCE(pl.priority, 0) as priority, i."createdAt"
     FROM "inventoryPoolLocation" pl
     JOIN "inventoryLocation" i ON i."distributionWarehouseId" = pl."locationId"
     WHERE pl."inventoryPoolId" = $1 AND pl."isActive" = true
       AND i."productId" = $2 AND i."productVariantId" IS NOT DISTINCT FROM $3
       AND i."status" = 'available' AND i."availableQuantity" > 0
     ORDER BY pl.priority ASC, i."createdAt" ASC`,
    [poolId, productId, variantId || null],
  );

  return (rows || []).map((row: PoolInventoryRow) => ({
    inventoryId: row.inventoryId,
    locationId: row.locationId,
    availableQuantity: Number(row.availableQuantity),
    priority: Number(row.priority),
    createdAt: new Date(row.createdAt),
  }));
}

export async function reserveStock(
  inventoryId: string,
  quantity: number,
  _orderId: string,
  _allocationId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "inventoryLocation" SET "reservedQuantity" = "reservedQuantity" + $1, "availableQuantity" = "availableQuantity" - $1, "updatedAt" = $2 WHERE "inventoryLocationId" = $3`,
    [quantity, now, inventoryId],
  );
}

export async function createAllocation(input: {
  allocationId: string;
  poolId: string;
  orderId: string;
  results: AllocationResultItem[];
  fullyAllocated: boolean;
  strategy: string;
}): Promise<void> {
  const now = new Date().toISOString();

  for (const result of input.results) {
    for (const alloc of result.allocations) {
      const allocId = generateUUID();
      await query(
        `INSERT INTO "inventoryAllocation" (
          "inventoryAllocationId", "inventoryPoolId", "productId", "variantId",
          "orderId", "sourceLocationId", quantity, status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'reserved', $8, $9)`,
        [
          allocId,
          input.poolId,
          result.productId,
          result.variantId || null,
          input.orderId,
          alloc.locationId,
          alloc.quantity,
          now,
          now,
        ],
      );
    }
  }
}

export default {
  createPool,
  findPoolById,
  findAvailableInPool,
  reserveStock,
  createAllocation,
};
