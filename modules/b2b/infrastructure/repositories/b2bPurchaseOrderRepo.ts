/**
 * B2B Purchase Order Repository
 * Table: b2bPurchaseOrder
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type B2bPurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';

export interface B2bPurchaseOrder {
  b2bPurchaseOrderId: string;
  b2bCompanyId: string;
  orderNumber?: string;
  status: B2bPurchaseOrderStatus;
  currency: string;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// Functions
// ============================================================================

export async function findByCompany(companyId: string): Promise<B2bPurchaseOrder[]> {
  return (
    (await query<B2bPurchaseOrder[]>(
      `SELECT * FROM "b2bPurchaseOrder" WHERE "b2bCompanyId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
      [companyId],
    )) ?? []
  );
}

export async function findById(b2bPurchaseOrderId: string): Promise<B2bPurchaseOrder | null> {
  return queryOne<B2bPurchaseOrder>(
    `SELECT * FROM "b2bPurchaseOrder" WHERE "b2bPurchaseOrderId" = $1 AND "deletedAt" IS NULL`,
    [b2bPurchaseOrderId],
  );
}

export async function create(data: {
  b2bCompanyId: string;
  orderNumber?: string;
  currency?: string;
  totalAmount?: number;
  notes?: string;
}): Promise<B2bPurchaseOrder> {
  const now = new Date().toISOString();
  return queryOne<B2bPurchaseOrder>(
    `INSERT INTO "b2bPurchaseOrder" ("b2bCompanyId", "orderNumber", "status", "currency", "totalAmount", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, 'draft', $3, $4, $5, $6, $6)
     RETURNING *`,
    [
      data.b2bCompanyId,
      data.orderNumber ?? null,
      data.currency ?? 'USD',
      data.totalAmount ?? 0,
      data.notes ?? null,
      now,
    ],
  ) as Promise<B2bPurchaseOrder>;
}

export async function updateStatus(
  b2bPurchaseOrderId: string,
  status: B2bPurchaseOrderStatus,
): Promise<B2bPurchaseOrder | null> {
  const now = new Date().toISOString();
  return queryOne<B2bPurchaseOrder>(
    `UPDATE "b2bPurchaseOrder" SET "status" = $1, "updatedAt" = $2
     WHERE "b2bPurchaseOrderId" = $3 AND "deletedAt" IS NULL
     RETURNING *`,
    [status, now, b2bPurchaseOrderId],
  );
}

export async function softDelete(b2bPurchaseOrderId: string): Promise<void> {
  await query(
    `UPDATE "b2bPurchaseOrder" SET "deletedAt" = $1, "updatedAt" = $1 WHERE "b2bPurchaseOrderId" = $2`,
    [new Date().toISOString(), b2bPurchaseOrderId],
  );
}
