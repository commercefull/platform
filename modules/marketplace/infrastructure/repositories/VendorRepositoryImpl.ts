import { query, queryOne } from '../../../../libs/db';
import { Vendor } from '../../domain/entities/Vendor';
import type {
  VendorAddress,
  VendorBankInfo,
  VendorProps,
  VendorStats,
  VendorStatus,
  VendorTier,
} from '../../domain/entities/Vendor';
import type { VendorRepository } from '../../domain/repositories/MarketplaceRepository';
import type { MarketplaceVendor as DbMarketplaceVendor } from '../../../../libs/db/types';

function rowToProps(row: DbMarketplaceVendor): VendorProps {
  return {
    ...row,
    legalName: row.legalName ?? undefined,
    taxId: row.taxId ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    description: row.description ?? undefined,
    status: row.status as VendorStatus,
    tier: row.tier as VendorTier,
    commissionRate: Number(row.commissionRate),
    address: (row.address ?? undefined) as VendorAddress | undefined,
    bankInfo: (row.bankInfo ?? undefined) as VendorBankInfo | undefined,
    stats: row.stats as unknown as VendorStats,
    approvedAt: row.approvedAt ?? undefined,
    suspendedAt: row.suspendedAt ?? undefined,
    terminatedAt: row.terminatedAt ?? undefined,
  };
}

export class VendorRepositoryImpl implements VendorRepository {
  async findById(vendorId: string): Promise<Vendor | null> {
    const row = await queryOne<DbMarketplaceVendor>(`SELECT * FROM "marketplaceVendor" WHERE "vendorId" = $1`, [vendorId]);
    return row ? Vendor.reconstitute(rowToProps(row)) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Vendor[]> {
    const rows = await query<DbMarketplaceVendor[]>(
      `SELECT * FROM "marketplaceVendor" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => Vendor.reconstitute(rowToProps(r)));
  }

  async findByEmail(email: string, organizationId: string): Promise<Vendor | null> {
    const row = await queryOne<DbMarketplaceVendor>(`SELECT * FROM "marketplaceVendor" WHERE "email" = $1 AND "organizationId" = $2`, [
      email,
      organizationId,
    ]);
    return row ? Vendor.reconstitute(rowToProps(row)) : null;
  }

  async findByStatus(status: string, organizationId: string): Promise<Vendor[]> {
    const rows = await query<DbMarketplaceVendor[]>(
      `SELECT * FROM "marketplaceVendor" WHERE "status" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC`,
      [status, organizationId],
    );
    return (rows ?? []).map(r => Vendor.reconstitute(rowToProps(r)));
  }

  async save(vendor: Vendor): Promise<void> {
    const json = vendor.toJSON();
    await query(
      `INSERT INTO "marketplaceVendor" (
        "vendorId", "organizationId", "name", "legalName", "taxId",
        "email", "phone", "website", "logoUrl", "description",
        "status", "tier", "commissionRate", "address", "bankInfo",
        "stats", "approvedAt", "suspendedAt", "terminatedAt",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      ON CONFLICT ("vendorId") DO UPDATE SET
        "name" = EXCLUDED."name",
        "legalName" = EXCLUDED."legalName",
        "taxId" = EXCLUDED."taxId",
        "email" = EXCLUDED."email",
        "phone" = EXCLUDED."phone",
        "website" = EXCLUDED."website",
        "logoUrl" = EXCLUDED."logoUrl",
        "description" = EXCLUDED."description",
        "status" = EXCLUDED."status",
        "tier" = EXCLUDED."tier",
        "commissionRate" = EXCLUDED."commissionRate",
        "address" = EXCLUDED."address",
        "bankInfo" = EXCLUDED."bankInfo",
        "stats" = EXCLUDED."stats",
        "approvedAt" = EXCLUDED."approvedAt",
        "suspendedAt" = EXCLUDED."suspendedAt",
        "terminatedAt" = EXCLUDED."terminatedAt",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      [
        json.vendorId,
        json.organizationId,
        json.name,
        json.legalName ?? null,
        json.taxId ?? null,
        json.email,
        json.phone ?? null,
        json.website ?? null,
        json.logoUrl ?? null,
        json.description ?? null,
        json.status,
        json.tier,
        json.commissionRate,
        JSON.stringify(json.address ?? null),
        JSON.stringify(json.bankInfo ?? null),
        JSON.stringify(json.stats),
        json.approvedAt ?? null,
        json.suspendedAt ?? null,
        json.terminatedAt ?? null,
        json.createdAt,
        json.updatedAt,
      ],
    );
  }

  async delete(vendorId: string): Promise<void> {
    await query(`DELETE FROM "marketplaceVendor" WHERE "vendorId" = $1`, [vendorId]);
  }
}
