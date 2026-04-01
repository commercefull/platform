/**
 * B2B Company Credit Limit Repository
 * Table: b2bCompanyCreditLimit
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface B2bCompanyCreditLimit {
  b2bCompanyCreditLimitId: string;
  b2bCompanyId: string;
  creditLimit: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Functions
// ============================================================================

export async function findByCompany(companyId: string): Promise<B2bCompanyCreditLimit | null> {
  return queryOne<B2bCompanyCreditLimit>(
    `SELECT * FROM "b2bCompanyCreditLimit" WHERE "b2bCompanyId" = $1`,
    [companyId],
  );
}

export async function create(data: {
  b2bCompanyId: string;
  creditLimit: number;
  currency?: string;
  notes?: string;
}): Promise<B2bCompanyCreditLimit> {
  const now = new Date().toISOString();
  return queryOne<B2bCompanyCreditLimit>(
    `INSERT INTO "b2bCompanyCreditLimit" ("b2bCompanyId", "creditLimit", "currency", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $5)
     RETURNING *`,
    [data.b2bCompanyId, data.creditLimit, data.currency ?? 'USD', data.notes ?? null, now],
  ) as Promise<B2bCompanyCreditLimit>;
}

export async function update(
  b2bCompanyCreditLimitId: string,
  data: { creditLimit?: number; currency?: string; notes?: string },
): Promise<B2bCompanyCreditLimit | null> {
  const now = new Date().toISOString();
  return queryOne<B2bCompanyCreditLimit>(
    `UPDATE "b2bCompanyCreditLimit"
     SET "creditLimit" = COALESCE($1, "creditLimit"),
         "currency"    = COALESCE($2, "currency"),
         "notes"       = COALESCE($3, "notes"),
         "updatedAt"   = $4
     WHERE "b2bCompanyCreditLimitId" = $5
     RETURNING *`,
    [data.creditLimit ?? null, data.currency ?? null, data.notes ?? null, now, b2bCompanyCreditLimitId],
  );
}
