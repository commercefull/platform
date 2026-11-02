import { query, queryOne } from '../../../../libs/db';
import { VendorPayout } from '../../domain/entities/VendorPayout';
import type { PayoutLineItem, PayoutMethod, PayoutStatus, VendorPayoutProps } from '../../domain/entities/VendorPayout';
import type { VendorPayoutRepository } from '../../domain/repositories/MarketplaceRepository';
import type { MarketplaceVendorPayout as DbMarketplaceVendorPayout } from '../../../../libs/db/types';

function toProps(row: DbMarketplaceVendorPayout): VendorPayoutProps {
  const { currencyCode, ...rest } = row;
  return {
    ...rest,
    currency: currencyCode,
    status: row.status as PayoutStatus,
    method: row.method as PayoutMethod,
    lineItems: Array.isArray(row.lineItems) ? (row.lineItems as PayoutLineItem[]) : [],
    transactionRef: row.transactionRef ?? undefined,
    failureReason: row.failureReason ?? undefined,
    processedAt: row.processedAt ?? undefined,
    completedAt: row.completedAt ?? undefined,
  };
}

export class VendorPayoutRepositoryImpl implements VendorPayoutRepository {
  async findById(payoutId: string): Promise<VendorPayout | null> {
    const row = await queryOne<DbMarketplaceVendorPayout>(`SELECT * FROM "marketplaceVendorPayout" WHERE "payoutId" = $1`, [payoutId]);
    return row ? VendorPayout.reconstitute(toProps(row)) : null;
  }

  async findByPayoutNumber(payoutNumber: string): Promise<VendorPayout | null> {
    const row = await queryOne<DbMarketplaceVendorPayout>(`SELECT * FROM "marketplaceVendorPayout" WHERE "payoutNumber" = $1`, [
      payoutNumber,
    ]);
    return row ? VendorPayout.reconstitute(toProps(row)) : null;
  }

  async findByVendorId(vendorId: string): Promise<VendorPayout[]> {
    const rows = await query<DbMarketplaceVendorPayout[]>(
      `SELECT * FROM "marketplaceVendorPayout" WHERE "vendorId" = $1 ORDER BY "createdAt" DESC`,
      [vendorId],
    );
    return (rows ?? []).map(r => VendorPayout.reconstitute(toProps(r)));
  }

  async findByOrganizationId(organizationId: string): Promise<VendorPayout[]> {
    const rows = await query<DbMarketplaceVendorPayout[]>(
      `SELECT * FROM "marketplaceVendorPayout" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => VendorPayout.reconstitute(toProps(r)));
  }

  async findByStatus(status: string, organizationId: string): Promise<VendorPayout[]> {
    const rows = await query<DbMarketplaceVendorPayout[]>(
      `SELECT * FROM "marketplaceVendorPayout" WHERE "status" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC`,
      [status, organizationId],
    );
    return (rows ?? []).map(r => VendorPayout.reconstitute(toProps(r)));
  }

  async findPendingByVendorId(vendorId: string): Promise<VendorPayout[]> {
    const rows = await query<DbMarketplaceVendorPayout[]>(
      `SELECT * FROM "marketplaceVendorPayout" WHERE "vendorId" = $1 AND "status" = 'pending' ORDER BY "createdAt" DESC`,
      [vendorId],
    );
    return (rows ?? []).map(r => VendorPayout.reconstitute(toProps(r)));
  }

  async save(payout: VendorPayout): Promise<void> {
    const json = payout.toJSON();
    await query(
      `INSERT INTO "marketplaceVendorPayout" (
        "payoutId", "vendorId", "organizationId", "payoutNumber", "status",
        "method", "periodStart", "periodEnd", "lineItems",
        "grossAmountCents", "commissionAmountCents", "netAmountCents", "currencyCode",
        "transactionRef", "failureReason", "processedAt", "completedAt",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT ("payoutId") DO UPDATE SET
        "status" = EXCLUDED."status",
        "lineItems" = EXCLUDED."lineItems",
        "grossAmountCents" = EXCLUDED."grossAmountCents",
        "commissionAmountCents" = EXCLUDED."commissionAmountCents",
        "netAmountCents" = EXCLUDED."netAmountCents",
        "transactionRef" = EXCLUDED."transactionRef",
        "failureReason" = EXCLUDED."failureReason",
        "processedAt" = EXCLUDED."processedAt",
        "completedAt" = EXCLUDED."completedAt",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      [
        json.payoutId,
        json.vendorId,
        json.organizationId,
        json.payoutNumber,
        json.status,
        json.method,
        json.periodStart,
        json.periodEnd,
        JSON.stringify(json.lineItems),
        json.grossAmountCents,
        json.commissionAmountCents,
        json.netAmountCents,
        json.currency,
        json.transactionRef ?? null,
        json.failureReason ?? null,
        json.processedAt ?? null,
        json.completedAt ?? null,
        json.createdAt,
        json.updatedAt,
      ],
    );
  }

  async delete(payoutId: string): Promise<void> {
    await query(`DELETE FROM "marketplaceVendorPayout" WHERE "payoutId" = $1`, [payoutId]);
  }
}
