/**
 * B2B Price List Repository
 * Table: b2bPriceList
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface B2bPriceList {
  b2bPriceListId: string;
  b2bCompanyId?: string;
  name: string;
  currency: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// Functions
// ============================================================================

export async function findAll(): Promise<B2bPriceList[]> {
  return (
    (await query<B2bPriceList[]>(
      `SELECT * FROM "b2bPriceList" WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
      [],
    )) ?? []
  );
}

export async function findById(b2bPriceListId: string): Promise<B2bPriceList | null> {
  return queryOne<B2bPriceList>(
    `SELECT * FROM "b2bPriceList" WHERE "b2bPriceListId" = $1 AND "deletedAt" IS NULL`,
    [b2bPriceListId],
  );
}

export async function findByCompany(companyId: string): Promise<B2bPriceList[]> {
  return (
    (await query<B2bPriceList[]>(
      `SELECT * FROM "b2bPriceList" WHERE "b2bCompanyId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
      [companyId],
    )) ?? []
  );
}

export async function create(data: {
  b2bCompanyId?: string;
  name: string;
  currency?: string;
  isActive?: boolean;
  notes?: string;
}): Promise<B2bPriceList> {
  const now = new Date().toISOString();
  return queryOne<B2bPriceList>(
    `INSERT INTO "b2bPriceList" ("b2bCompanyId", "name", "currency", "isActive", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $6)
     RETURNING *`,
    [
      data.b2bCompanyId ?? null,
      data.name,
      data.currency ?? 'USD',
      data.isActive ?? true,
      data.notes ?? null,
      now,
    ],
  ) as Promise<B2bPriceList>;
}

export async function update(
  b2bPriceListId: string,
  data: { name?: string; currency?: string; isActive?: boolean; notes?: string },
): Promise<B2bPriceList | null> {
  const now = new Date().toISOString();
  return queryOne<B2bPriceList>(
    `UPDATE "b2bPriceList"
     SET "name"      = COALESCE($1, "name"),
         "currency"  = COALESCE($2, "currency"),
         "isActive"  = COALESCE($3, "isActive"),
         "notes"     = COALESCE($4, "notes"),
         "updatedAt" = $5
     WHERE "b2bPriceListId" = $6 AND "deletedAt" IS NULL
     RETURNING *`,
    [data.name ?? null, data.currency ?? null, data.isActive ?? null, data.notes ?? null, now, b2bPriceListId],
  );
}

export async function softDelete(b2bPriceListId: string): Promise<void> {
  await query(
    `UPDATE "b2bPriceList" SET "deletedAt" = $1, "updatedAt" = $1 WHERE "b2bPriceListId" = $2`,
    [new Date().toISOString(), b2bPriceListId],
  );
}
