/**
 * B2B Company Credit Transaction Repository
 * Table: b2bCompanyCreditTransaction
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface B2bCompanyCreditTransaction {
  b2bCompanyCreditTransactionId: string;
  b2bCompanyId: string;
  amount: number;
  type: string;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
}

// ============================================================================
// Functions
// ============================================================================

export async function findByCompany(companyId: string): Promise<B2bCompanyCreditTransaction[]> {
  return (
    (await query<B2bCompanyCreditTransaction[]>(
      `SELECT * FROM "b2bCompanyCreditTransaction" WHERE "b2bCompanyId" = $1 ORDER BY "createdAt" DESC`,
      [companyId],
    )) ?? []
  );
}

export async function findByDateRange(
  companyId: string,
  from: Date,
  to: Date,
): Promise<B2bCompanyCreditTransaction[]> {
  return (
    (await query<B2bCompanyCreditTransaction[]>(
      `SELECT * FROM "b2bCompanyCreditTransaction"
       WHERE "b2bCompanyId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
       ORDER BY "createdAt" DESC`,
      [companyId, from.toISOString(), to.toISOString()],
    )) ?? []
  );
}

export async function create(data: {
  b2bCompanyId: string;
  amount: number;
  type: string;
  referenceId?: string;
  notes?: string;
}): Promise<B2bCompanyCreditTransaction> {
  const now = new Date().toISOString();
  return queryOne<B2bCompanyCreditTransaction>(
    `INSERT INTO "b2bCompanyCreditTransaction" ("b2bCompanyId", "amount", "type", "referenceId", "notes", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.b2bCompanyId, data.amount, data.type, data.referenceId ?? null, data.notes ?? null, now],
  ) as Promise<B2bCompanyCreditTransaction>;
}

export async function getBalance(companyId: string): Promise<number> {
  const result = await queryOne<{ balance: string }>(
    `SELECT COALESCE(SUM("amount"), 0) AS balance FROM "b2bCompanyCreditTransaction" WHERE "b2bCompanyId" = $1`,
    [companyId],
  );
  return parseFloat(result?.balance ?? '0');
}
