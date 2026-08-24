import { query, queryOne } from '../../../../libs/db';
import { Vendor, VendorProps } from '../../domain/entities/Vendor';
import type { VendorRepository } from '../../domain/repositories/MarketplaceRepository';

export class VendorRepositoryImpl implements VendorRepository {
  async findById(vendorId: string): Promise<Vendor | null> {
    const row = await queryOne<VendorProps>(
      `SELECT * FROM "marketplaceVendor" WHERE "vendorId" = $1`,
      [vendorId],
    );
    return row ? Vendor.reconstitute(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Vendor[]> {
    const rows = await query<VendorProps[]>(
      `SELECT * FROM "marketplaceVendor" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => Vendor.reconstitute(r));
  }

  async findByEmail(email: string, organizationId: string): Promise<Vendor | null> {
    const row = await queryOne<VendorProps>(
      `SELECT * FROM "marketplaceVendor" WHERE "email" = $1 AND "organizationId" = $2`,
      [email, organizationId],
    );
    return row ? Vendor.reconstitute(row) : null;
  }

  async findByStatus(status: string, organizationId: string): Promise<Vendor[]> {
    const rows = await query<VendorProps[]>(
      `SELECT * FROM "marketplaceVendor" WHERE "status" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC`,
      [status, organizationId],
    );
    return (rows ?? []).map(r => Vendor.reconstitute(r));
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
        json.vendorId, json.organizationId, json.name, json.legalName ?? null,
        json.taxId ?? null, json.email, json.phone ?? null, json.website ?? null,
        json.logoUrl ?? null, json.description ?? null, json.status, json.tier,
        json.commissionRate, JSON.stringify(json.address ?? null),
        JSON.stringify(json.bankInfo ?? null), JSON.stringify(json.stats),
        json.approvedAt ?? null, json.suspendedAt ?? null, json.terminatedAt ?? null,
        json.createdAt, json.updatedAt,
      ],
    );
  }

  async delete(vendorId: string): Promise<void> {
    await query(`DELETE FROM "marketplaceVendor" WHERE "vendorId" = $1`, [vendorId]);
  }
}
