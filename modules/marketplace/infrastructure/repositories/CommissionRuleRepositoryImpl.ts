import { query, queryOne } from '../../../../libs/db';
import { CommissionRule, CommissionRuleProps } from '../../domain/entities/CommissionRule';
import type { CommissionRuleRepository } from '../../domain/repositories/MarketplaceRepository';

export class CommissionRuleRepositoryImpl implements CommissionRuleRepository {
  async findById(ruleId: string): Promise<CommissionRule | null> {
    const row = await queryOne<CommissionRuleProps>(
      `SELECT * FROM "marketplaceCommissionRule" WHERE "ruleId" = $1`,
      [ruleId],
    );
    return row ? CommissionRule.reconstitute(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<CommissionRule[]> {
    const rows = await query<CommissionRuleProps[]>(
      `SELECT * FROM "marketplaceCommissionRule" WHERE "organizationId" = $1 ORDER BY "priority" DESC, "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => CommissionRule.reconstitute(r));
  }

  async findActiveByOrganizationId(organizationId: string): Promise<CommissionRule[]> {
    const rows = await query<CommissionRuleProps[]>(
      `SELECT * FROM "marketplaceCommissionRule"
       WHERE "organizationId" = $1 AND "active" = true
       AND ("startsAt" IS NULL OR "startsAt" <= NOW())
       AND ("endsAt" IS NULL OR "endsAt" >= NOW())
       ORDER BY "priority" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => CommissionRule.reconstitute(r));
  }

  async findByVendorId(vendorId: string, organizationId: string): Promise<CommissionRule[]> {
    const rows = await query<CommissionRuleProps[]>(
      `SELECT * FROM "marketplaceCommissionRule" WHERE "vendorId" = $1 AND "organizationId" = $2 ORDER BY "priority" DESC`,
      [vendorId, organizationId],
    );
    return (rows ?? []).map(r => CommissionRule.reconstitute(r));
  }

  async findByCategoryId(categoryId: string, organizationId: string): Promise<CommissionRule[]> {
    const rows = await query<CommissionRuleProps[]>(
      `SELECT * FROM "marketplaceCommissionRule" WHERE "categoryId" = $1 AND "organizationId" = $2 ORDER BY "priority" DESC`,
      [categoryId, organizationId],
    );
    return (rows ?? []).map(r => CommissionRule.reconstitute(r));
  }

  async save(rule: CommissionRule): Promise<void> {
    const json = rule.toJSON();
    await query(
      `INSERT INTO "marketplaceCommissionRule" (
        "ruleId", "organizationId", "name", "type", "scope",
        "rate", "fixedAmount", "tiers", "categoryId", "vendorId", "productId",
        "priority", "active", "startsAt", "endsAt", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT ("ruleId") DO UPDATE SET
        "name" = EXCLUDED."name",
        "rate" = EXCLUDED."rate",
        "fixedAmount" = EXCLUDED."fixedAmount",
        "tiers" = EXCLUDED."tiers",
        "priority" = EXCLUDED."priority",
        "active" = EXCLUDED."active",
        "startsAt" = EXCLUDED."startsAt",
        "endsAt" = EXCLUDED."endsAt",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      [
        json.ruleId, json.organizationId, json.name, json.type, json.scope,
        json.rate, json.fixedAmount ?? null, JSON.stringify(json.tiers ?? null),
        json.categoryId ?? null, json.vendorId ?? null, json.productId ?? null,
        json.priority, json.active, json.startsAt ?? null, json.endsAt ?? null,
        json.createdAt, json.updatedAt,
      ],
    );
  }

  async delete(ruleId: string): Promise<void> {
    await query(`DELETE FROM "marketplaceCommissionRule" WHERE "ruleId" = $1`, [ruleId]);
  }
}
