/**
 * Tax Exemption Repository
 *
 * Manages B2B tax exemption certificates.
 */

import { query, queryOne } from '../../../libs/db';
import { TaxExemption } from '../../../libs/db/dataModelTypes';

function generateId(): string {
  return `texempt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreateTaxExemptionParams {
  accountId: string;
  type: 'resale' | 'nonprofit' | 'government' | 'manufacturing';
  certificateRef?: string;
  certificateDocument?: string;
  jurisdiction?: string;
  validFrom: Date;
  validTo?: Date;
}

export async function create(params: CreateTaxExemptionParams): Promise<TaxExemption> {
  const taxExemptionId = generateId();
  const now = new Date();

  const sql = `
    INSERT INTO "taxExemption" (
      "taxExemptionId", "accountId", "type", "certificateRef", "certificateDocument",
      "jurisdiction", "validFrom", "validTo", "status", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await query<{ rows: TaxExemption[] }>(sql, [
    taxExemptionId,
    params.accountId,
    params.type,
    params.certificateRef || null,
    params.certificateDocument || null,
    params.jurisdiction || null,
    params.validFrom,
    params.validTo || null,
    'active',
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(taxExemptionId: string): Promise<TaxExemption | null> {
  return queryOne<TaxExemption>('SELECT * FROM "taxExemption" WHERE "taxExemptionId" = $1', [taxExemptionId]);
}

export async function findByAccount(accountId: string): Promise<TaxExemption[]> {
  const result = await query<{ rows: TaxExemption[] }>('SELECT * FROM "taxExemption" WHERE "accountId" = $1 ORDER BY "createdAt" DESC', [
    accountId,
  ]);
  return result?.rows ?? [];
}

export async function findActiveByAccount(accountId: string, jurisdiction?: string): Promise<TaxExemption[]> {
  let sql =
    'SELECT * FROM "taxExemption" WHERE "accountId" = $1 AND "status" = \'active\' AND ("validTo" IS NULL OR "validTo" >= CURRENT_DATE)';
  const params: unknown[] = [accountId];

  if (jurisdiction) {
    sql += ' AND ("jurisdiction" = $2 OR "jurisdiction" IS NULL)';
    params.push(jurisdiction);
  }

  sql += ' ORDER BY "jurisdiction" NULLS LAST';

  const result = await query<{ rows: TaxExemption[] }>(sql, params);
  return result?.rows ?? [];
}

export async function verify(taxExemptionId: string, verifiedBy: string): Promise<TaxExemption | null> {
  const now = new Date();
  const result = await query<{ rows: TaxExemption[] }>(
    'UPDATE "taxExemption" SET "verifiedAt" = $1, "verifiedBy" = $2, "updatedAt" = $3 WHERE "taxExemptionId" = $4 RETURNING *',
    [now, verifiedBy, now, taxExemptionId],
  );
  return result?.rows?.[0] ?? null;
}

export async function revoke(taxExemptionId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "taxExemption" SET "status" = \'revoked\', "updatedAt" = $1 WHERE "taxExemptionId" = $2',
    [new Date(), taxExemptionId],
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function expireOutdated(): Promise<number> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "taxExemption" SET "status" = \'expired\', "updatedAt" = $1 WHERE "status" = \'active\' AND "validTo" IS NOT NULL AND "validTo" < CURRENT_DATE',
    [new Date()],
  );
  return result?.rowCount ?? 0;
}

export async function isExempt(accountId: string, jurisdiction: string): Promise<boolean> {
  const exemptions = await findActiveByAccount(accountId, jurisdiction);
  return exemptions.length > 0;
}

export default {
  create,
  findById,
  findByAccount,
  findActiveByAccount,
  verify,
  revoke,
  expireOutdated,
  isExempt,
};
