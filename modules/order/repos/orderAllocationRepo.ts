/**
 * Order Allocation Repository
 * 
 * Manages order line allocations to fulfillment locations.
 */

import { query, queryOne } from '../../../libs/db';
import { OrderAllocation } from '../../../libs/db/dataModelTypes';

function generateId(): string {
  return `alloc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreateAllocationParams {
  orderLineId: string;
  locationId: string;
  sellerId?: string;
  quantity: number;
}

export async function create(params: CreateAllocationParams): Promise<OrderAllocation> {
  const allocationId = generateId();
  const now = new Date();

  const sql = `
    INSERT INTO "orderAllocation" (
      "allocationId", "orderLineId", "locationId", "sellerId",
      "quantity", "status", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await query<{ rows: OrderAllocation[] }>(sql, [
    allocationId,
    params.orderLineId,
    params.locationId,
    params.sellerId || null,
    params.quantity,
    'allocated',
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(allocationId: string): Promise<OrderAllocation | null> {
  return queryOne<OrderAllocation>(
    'SELECT * FROM "orderAllocation" WHERE "allocationId" = $1',
    [allocationId]
  );
}

export async function findByOrderLine(orderLineId: string): Promise<OrderAllocation[]> {
  const result = await query<{ rows: OrderAllocation[] }>(
    'SELECT * FROM "orderAllocation" WHERE "orderLineId" = $1 ORDER BY "createdAt" ASC',
    [orderLineId]
  );
  return result?.rows ?? [];
}

export async function findByLocation(
  locationId: string,
  status?: string
): Promise<OrderAllocation[]> {
  let sql = 'SELECT * FROM "orderAllocation" WHERE "locationId" = $1';
  const params: unknown[] = [locationId];

  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }

  sql += ' ORDER BY "createdAt" ASC';

  const result = await query<{ rows: OrderAllocation[] }>(sql, params);
  return result?.rows ?? [];
}

export async function findBySeller(
  sellerId: string,
  status?: string
): Promise<OrderAllocation[]> {
  let sql = 'SELECT * FROM "orderAllocation" WHERE "sellerId" = $1';
  const params: unknown[] = [sellerId];

  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }

  sql += ' ORDER BY "createdAt" ASC';

  const result = await query<{ rows: OrderAllocation[] }>(sql, params);
  return result?.rows ?? [];
}

export async function updateStatus(
  allocationId: string,
  status: 'allocated' | 'picked' | 'packed' | 'shipped'
): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "orderAllocation" SET "status" = $1, "updatedAt" = $2 WHERE "allocationId" = $3',
    [status, new Date(), allocationId]
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function markPicked(allocationId: string): Promise<boolean> {
  return updateStatus(allocationId, 'picked');
}

export async function markPacked(allocationId: string): Promise<boolean> {
  return updateStatus(allocationId, 'packed');
}

export async function markShipped(allocationId: string): Promise<boolean> {
  return updateStatus(allocationId, 'shipped');
}

export async function getAllocationsByOrder(orderId: string): Promise<OrderAllocation[]> {
  const sql = `
    SELECT oa.* FROM "orderAllocation" oa
    JOIN "orderLine" ol ON ol."orderLineId" = oa."orderLineId"
    WHERE ol."orderId" = $1
    ORDER BY oa."createdAt" ASC
  `;
  const result = await query<{ rows: OrderAllocation[] }>(sql, [orderId]);
  return result?.rows ?? [];
}

export async function groupByLocation(orderId: string): Promise<Map<string, OrderAllocation[]>> {
  const allocations = await getAllocationsByOrder(orderId);
  const grouped = new Map<string, OrderAllocation[]>();

  for (const allocation of allocations) {
    const existing = grouped.get(allocation.locationId) || [];
    existing.push(allocation);
    grouped.set(allocation.locationId, existing);
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
