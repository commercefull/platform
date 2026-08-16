/**
 * Order Allocation Repository
 *
 * Manages order line allocations to fulfillment locations.
 */

import { query, queryOne } from '../../../../libs/db';
import { OrderAllocation } from '../../../../libs/db/types';
import crypto from 'crypto';

export interface CreateAllocationParams {
  orderLineId: string;
  locationId: string;
  sellerId?: string;
  quantity: number;
}

export async function create(params: CreateAllocationParams): Promise<OrderAllocation> {
  const allocationId = crypto.randomUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "orderAllocation" (
      "orderAllocationId", "orderLineId", "locationId", "sellerId",
      "quantity", "status", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await queryOne<OrderAllocation>(sql, [
    allocationId,
    params.orderLineId,
    params.locationId,
    params.sellerId || null,
    params.quantity,
    'allocated',
    now,
    now,
  ]);

  if (!result) {
    throw new Error('Failed to create order allocation');
  }
  return result;
}

export async function findById(orderAllocationId: string): Promise<OrderAllocation | null> {
  return queryOne<OrderAllocation>('SELECT * FROM "orderAllocation" WHERE "orderAllocationId" = $1', [orderAllocationId]);
}

export async function findByOrderLine(orderLineId: string): Promise<OrderAllocation[]> {
  const result = await query<OrderAllocation[]>(
    'SELECT * FROM "orderAllocation" WHERE "orderLineId" = $1 ORDER BY "createdAt" ASC',
    [orderLineId],
  );
  return result ?? [];
}

export async function findByLocation(locationId: string, status?: string): Promise<OrderAllocation[]> {
  let sql = 'SELECT * FROM "orderAllocation" WHERE "locationId" = $1';
  const params: unknown[] = [locationId];

  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }

  sql += ' ORDER BY "createdAt" ASC';

  const result = await query<OrderAllocation[]>(sql, params);
  return result ?? [];
}

export async function findBySeller(sellerId: string, status?: string): Promise<OrderAllocation[]> {
  let sql = 'SELECT * FROM "orderAllocation" WHERE "sellerId" = $1';
  const params: unknown[] = [sellerId];

  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }

  sql += ' ORDER BY "createdAt" ASC';

  const result = await query<OrderAllocation[]>(sql, params);
  return result ?? [];
}

export async function updateStatus(orderAllocationId: string, status: 'allocated' | 'picked' | 'packed' | 'shipped'): Promise<boolean> {
  const result = await queryOne<OrderAllocation>(
    'UPDATE "orderAllocation" SET "status" = $1, "updatedAt" = $2 WHERE "orderAllocationId" = $3 RETURNING *',
    [status, new Date(), orderAllocationId],
  );
  return result !== null;
}

export async function markPicked(orderAllocationId: string): Promise<boolean> {
  return updateStatus(orderAllocationId, 'picked');
}

export async function markPacked(orderAllocationId: string): Promise<boolean> {
  return updateStatus(orderAllocationId, 'packed');
}

export async function markShipped(orderAllocationId: string): Promise<boolean> {
  return updateStatus(orderAllocationId, 'shipped');
}

export async function getAllocationsByOrder(orderId: string): Promise<OrderAllocation[]> {
  const sql = `
    SELECT oa.* FROM "orderAllocation" oa
    JOIN "orderLine" ol ON ol."orderLineId" = oa."orderLineId"
    WHERE ol."orderId" = $1
    ORDER BY oa."createdAt" ASC
  `;
  const result = await query<OrderAllocation[]>(sql, [orderId]);
  return result ?? [];
}

export async function groupByLocation(orderId: string): Promise<Map<string, OrderAllocation[]>> {
  const allocations = await getAllocationsByOrder(orderId);
  const grouped = new Map<string, OrderAllocation[]>();

  for (const allocation of allocations) {
    const existing = grouped.get(allocation.locationId || '') || [];
    existing.push(allocation);
    grouped.set(allocation.locationId || '', existing);
  }

  return grouped;
}

export async function groupBySeller(orderId: string): Promise<Map<string, OrderAllocation[]>> {
  const allocations = await getAllocationsByOrder(orderId);
  const grouped = new Map<string, OrderAllocation[]>();

  for (const allocation of allocations) {
    const sellerId = allocation.sellerId || 'platform';
    const existing = grouped.get(sellerId) || [];
    existing.push(allocation);
    grouped.set(sellerId, existing);
  }

  return grouped;
}

export default {
  create,
  findById,
  findByOrderLine,
  findByLocation,
  findBySeller,
  updateStatus,
  markPicked,
  markPacked,
  markShipped,
  getAllocationsByOrder,
  groupByLocation,
  groupBySeller,
};
