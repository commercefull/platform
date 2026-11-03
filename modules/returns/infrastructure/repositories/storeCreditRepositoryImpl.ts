import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import type { StoreCreditRepository } from '../../domain/repositories/ReturnRepository';
import { StoreCreditLedgerEntry } from '../../domain/entities/StoreCredit';
import type { StoreCreditEntryType, CustomerStoreCreditBalance } from '../../domain/entities/StoreCredit';
import { ReturnValidationError } from '../../domain/errors/ReturnErrors';
import type { StoreCreditLedger as DbStoreCreditLedger } from '../../../../libs/db/types';

export class StoreCreditRepositoryImpl implements StoreCreditRepository {
  async getBalance(customerId: string): Promise<CustomerStoreCreditBalance> {
    const row = await queryOne<{
      balanceCents: string;
      totalCreditsCents: string;
      totalDebitsCents: string;
      pendingExpiryCents: string;
      lastEntryAt: Date | null;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN "entryType" = 'credit' THEN "amountCents" ELSE 0 END) -
                 SUM(CASE WHEN "entryType" IN ('debit', 'expiry') THEN "amountCents" ELSE 0 END), 0) as "balanceCents",
        COALESCE(SUM(CASE WHEN "entryType" = 'credit' THEN "amountCents" ELSE 0 END), 0) as "totalCreditsCents",
        COALESCE(SUM(CASE WHEN "entryType" IN ('debit', 'expiry') THEN "amountCents" ELSE 0 END), 0) as "totalDebitsCents",
        COALESCE(SUM(CASE WHEN "entryType" = 'credit' AND "expiresAt" IS NOT NULL AND "expiresAt" > NOW() THEN "amountCents" ELSE 0 END), 0) as "pendingExpiryCents",
        MAX("createdAt") as "lastEntryAt"
       FROM "storeCreditLedger" WHERE "customerId" = $1`,
      [customerId],
    );

    return {
      customerId,
      balanceCents: row ? parseFloat(row.balanceCents) : 0,
      currency: 'USD',
      totalCreditsCents: row ? parseFloat(row.totalCreditsCents) : 0,
      totalDebitsCents: row ? parseFloat(row.totalDebitsCents) : 0,
      pendingExpiryCents: row ? parseFloat(row.pendingExpiryCents) : 0,
      lastEntryAt: row?.lastEntryAt ?? null,
    };
  }

  async addEntry(entry: StoreCreditLedgerEntry): Promise<StoreCreditLedgerEntry> {
    const props = entry.toJSON();
    const row = await queryOne<{
      storeCreditLedgerId: string;
      customerId: string;
      entryType: string;
      referenceType: string | null;
      referenceId: string | null;
      amountCents: string;
      balanceAfterCents: string;
      currencyCode: string;
      reason: string | null;
      notes: string | null;
      createdBy: string | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>(
      `INSERT INTO "storeCreditLedger" (
        "customerId", "entryType", "referenceType", "referenceId",
        "amountCents", "balanceAfterCents", "currencyCode", "reason", "notes",
        "createdBy", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        props.customerId,
        props.entryType,
        props.referenceType ?? null,
        props.referenceId ?? null,
        props.amountCents,
        props.balanceAfterCents,
        props.currency,
        props.reason ?? null,
        props.notes ?? null,
        props.createdBy ?? null,
        props.expiresAt ?? null,
        props.createdAt,
        props.updatedAt,
      ],
    );
    if (!row) throw new ReturnValidationError('Failed to create store credit entry');

    return StoreCreditLedgerEntry.reconstitute({
      ...row,
      entryType: row.entryType as StoreCreditEntryType,
      currency: row.currencyCode,
      amountCents: Number(row.amountCents),
      balanceAfterCents: Number(row.balanceAfterCents),
      referenceType: row.referenceType ?? undefined,
      referenceId: row.referenceId ?? undefined,
      reason: row.reason ?? undefined,
      notes: row.notes ?? undefined,
      createdBy: row.createdBy ?? undefined,
      expiresAt: row.expiresAt ?? undefined,
    });
  }

  async getLedger(customerId: string, limit = 50): Promise<StoreCreditLedgerEntry[]> {
    const rows = await query<DbStoreCreditLedger[]>(`SELECT * FROM "storeCreditLedger" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [customerId, limit],
    );
    return (rows || []).map((row: Record<string, unknown>) =>
      StoreCreditLedgerEntry.reconstitute({
        storeCreditLedgerId: row.storeCreditLedgerId as string,
        customerId: row.customerId as string,
        entryType: row.entryType as StoreCreditEntryType,
        referenceType: row.referenceType as string | undefined,
        referenceId: row.referenceId as string | undefined,
        amountCents: Number(row.amountCents),
        balanceAfterCents: parseFloat(row.balanceAfterCents as string),
        currency: row.currencyCode as string,
        reason: row.reason as string | undefined,
        notes: row.notes as string | undefined,
        createdBy: row.createdBy as string | undefined,
        expiresAt: row.expiresAt as Date | undefined,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      }),
    );
  }

  async findByReference(referenceType: string, referenceId: string): Promise<StoreCreditLedgerEntry | null> {
    const row = await queryOne<Record<string, unknown>>(
      `SELECT * FROM "storeCreditLedger" WHERE "referenceType" = $1 AND "referenceId" = $2`,
      [referenceType, referenceId],
    );
    if (!row) return null;
    return StoreCreditLedgerEntry.reconstitute({
      storeCreditLedgerId: row.storeCreditLedgerId as string,
      customerId: row.customerId as string,
      entryType: row.entryType as StoreCreditEntryType,
      referenceType: row.referenceType as string | undefined,
      referenceId: row.referenceId as string | undefined,
      amountCents: Number(row.amountCents),
      balanceAfterCents: parseFloat(row.balanceAfterCents as string),
      currency: row.currencyCode as string,
      reason: row.reason as string | undefined,
      notes: row.notes as string | undefined,
      createdBy: row.createdBy as string | undefined,
      expiresAt: row.expiresAt as Date | undefined,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    });
  }

  async processExpiry(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `WITH expired AS (
        SELECT "storeCreditLedgerId", "customerId", "amountCents"
        FROM "storeCreditLedger"
        WHERE "entryType" = 'credit'
          AND "expiresAt" IS NOT NULL
          AND "expiresAt" < NOW()
          AND "storeCreditLedgerId" NOT IN (
            SELECT "referenceId" FROM "storeCreditLedger" WHERE "entryType" = 'expiry' AND "referenceType" = 'storeCredit'
          )
      )
      INSERT INTO "storeCreditLedger" ("customerId", "entryType", "referenceType", "referenceId", "amountCents", "balanceAfterCents", "currencyCode", "reason", "createdAt", "updatedAt")
      SELECT e."customerId", 'expiry', 'storeCredit', e."storeCreditLedgerId", e."amountCents", 0, 'USD', 'Credit expired', NOW(), NOW()
      FROM expired e
      RETURNING 1`,
    );
    const count = result ? parseInt(result.count, 10) : 0;
    if (count > 0) logger.info('Store credit expiry processed', { count });
    return count;
  }
}
