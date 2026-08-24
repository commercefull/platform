import { query, queryOne } from '../../../../libs/db';
import { Company, CompanyProps } from '../../domain/entities/Company';
import type { CompanyRepository } from '../../domain/repositories/B2BRepository';

export class CompanyRepositoryImpl implements CompanyRepository {
  async findById(companyId: string): Promise<Company | null> {
    const row = await queryOne<CompanyProps>(
      `SELECT * FROM "b2bCompany" WHERE "companyId" = $1`,
      [companyId],
    );
    return row ? Company.reconstitute(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Company[]> {
    const rows = await query<CompanyProps[]>(
      `SELECT * FROM "b2bCompany" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => Company.reconstitute(r));
  }

  async findByName(name: string, organizationId: string): Promise<Company | null> {
    const row = await queryOne<CompanyProps>(
      `SELECT * FROM "b2bCompany" WHERE "name" = $1 AND "organizationId" = $2`,
      [name, organizationId],
    );
    return row ? Company.reconstitute(row) : null;
  }

  async findByParentId(parentId: string): Promise<Company[]> {
    const rows = await query<CompanyProps[]>(
      `SELECT * FROM "b2bCompany" WHERE "parentId" = $1 ORDER BY "createdAt" DESC`,
      [parentId],
    );
    return (rows ?? []).map(r => Company.reconstitute(r));
  }

  async save(company: Company): Promise<void> {
    const json = company.toJSON();
    await query(
      `INSERT INTO "b2bCompany" (
        "companyId", "organizationId", "name", "legalName", "taxId",
        "status", "paymentTerms", "creditLimit", "outstandingBalance",
        "billingAddress", "shippingAddress", "contactEmail", "contactPhone",
        "website", "parentId", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT ("companyId") DO UPDATE SET
        "name" = EXCLUDED."name",
        "legalName" = EXCLUDED."legalName",
        "taxId" = EXCLUDED."taxId",
        "status" = EXCLUDED."status",
        "paymentTerms" = EXCLUDED."paymentTerms",
        "creditLimit" = EXCLUDED."creditLimit",
        "outstandingBalance" = EXCLUDED."outstandingBalance",
        "billingAddress" = EXCLUDED."billingAddress",
        "shippingAddress" = EXCLUDED."shippingAddress",
        "contactEmail" = EXCLUDED."contactEmail",
        "contactPhone" = EXCLUDED."contactPhone",
        "website" = EXCLUDED."website",
        "parentId" = EXCLUDED."parentId",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      [
        json.companyId, json.organizationId, json.name, json.legalName ?? null,
        json.taxId ?? null, json.status, json.paymentTerms, json.creditLimit ?? null,
        json.outstandingBalance, JSON.stringify(json.billingAddress ?? null),
        JSON.stringify(json.shippingAddress ?? null), json.contactEmail ?? null,
        json.contactPhone ?? null, json.website ?? null, json.parentId ?? null,
        json.createdAt, json.updatedAt,
      ],
    );
  }

  async delete(companyId: string): Promise<void> {
    await query(`DELETE FROM "b2bCompany" WHERE "companyId" = $1`, [companyId]);
  }
}
