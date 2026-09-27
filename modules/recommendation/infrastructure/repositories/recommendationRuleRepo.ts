/**
 * Rule + exclusion repositories — merchant CRUD over recommendationRule
 * and recommendationExclusion.
 */

import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import type { ExclusionRepository, RuleRepository } from '../../domain/repositories/RuleRepository';
import type { SignalScope } from '../../domain/repositories/CoPurchaseRepository';
import type {
  RecommendationRuleCreateProps,
  RecommendationRuleProps,
  RecommendationRuleUpdateProps,
} from '../../domain/entities/RecommendationRule';
import type { RecommendationExclusionCreateProps, RecommendationExclusionProps } from '../../domain/entities/RecommendationExclusion';
import { ALL_STORES } from './recommendationSignalRepo';

export class RecommendationRuleRepository implements RuleRepository {
  async list(organizationId: string): Promise<RecommendationRuleProps[]> {
    const rows = await query<RecommendationRuleProps[]>(
      `SELECT * FROM "recommendationRule" WHERE "organizationId" = $1 ORDER BY priority DESC, "createdAt" ASC`,
      [organizationId],
    );
    return rows || [];
  }

  async findById(recommendationRuleId: string): Promise<RecommendationRuleProps | null> {
    return queryOne<RecommendationRuleProps>(`SELECT * FROM "recommendationRule" WHERE "recommendationRuleId" = $1`, [
      recommendationRuleId,
    ]);
  }

  async listActiveForSource(organizationId: string, sourceType: string, sourceId: string): Promise<RecommendationRuleProps[]> {
    const rows = await query<RecommendationRuleProps[]>(
      `SELECT * FROM "recommendationRule"
       WHERE "organizationId" = $1 AND "sourceType" = $2 AND "sourceId" = $3 AND "isActive" = true
       ORDER BY priority DESC`,
      [organizationId, sourceType, sourceId],
    );
    return rows || [];
  }

  async listActive(organizationId: string): Promise<RecommendationRuleProps[]> {
    const rows = await query<RecommendationRuleProps[]>(
      `SELECT * FROM "recommendationRule" WHERE "organizationId" = $1 AND "isActive" = true ORDER BY priority DESC`,
      [organizationId],
    );
    return rows || [];
  }

  async create(props: RecommendationRuleCreateProps): Promise<RecommendationRuleProps> {
    const now = unixTimestamp();
    const result = await queryOne<RecommendationRuleProps>(
      `INSERT INTO "recommendationRule"
         ("organizationId", "storeId", name, "sourceType", "sourceId", "targetType", "targetId",
          "relationType", "targetSort", "priceBand", "maxItems", priority, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        props.organizationId,
        props.storeId ?? ALL_STORES,
        props.name,
        props.sourceType,
        props.sourceId,
        props.targetType,
        props.targetId,
        props.relationType,
        props.targetSort,
        props.priceBand,
        props.maxItems,
        props.priority,
        props.isActive,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create recommendation rule');
    return result;
  }

  async update(recommendationRuleId: string, props: RecommendationRuleUpdateProps): Promise<RecommendationRuleProps | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const map: Record<string, unknown> = {
      name: props.name,
      sourceType: props.sourceType,
      sourceId: props.sourceId,
      targetType: props.targetType,
      targetId: props.targetId,
      relationType: props.relationType,
      targetSort: props.targetSort,
      priceBand: props.priceBand,
      maxItems: props.maxItems,
      priority: props.priority,
      isActive: props.isActive,
      storeId: props.storeId === null ? ALL_STORES : props.storeId,
    };
    for (const [key, value] of Object.entries(map)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return this.findById(recommendationRuleId);
    fields.push(`"updatedAt" = $${i++}`);
    values.push(unixTimestamp(), recommendationRuleId);
    return queryOne<RecommendationRuleProps>(
      `UPDATE "recommendationRule" SET ${fields.join(', ')} WHERE "recommendationRuleId" = $${i} RETURNING *`,
      values,
    );
  }

  async delete(recommendationRuleId: string): Promise<boolean> {
    const result = await queryOne<{ recommendationRuleId: string }>(
      `DELETE FROM "recommendationRule" WHERE "recommendationRuleId" = $1 RETURNING "recommendationRuleId"`,
      [recommendationRuleId],
    );
    return !!result;
  }
}

export class RecommendationExclusionRepository implements ExclusionRepository {
  async list(organizationId: string): Promise<RecommendationExclusionProps[]> {
    const rows = await query<RecommendationExclusionProps[]>(
      `SELECT * FROM "recommendationExclusion" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return rows || [];
  }

  async create(props: RecommendationExclusionCreateProps): Promise<RecommendationExclusionProps> {
    const now = unixTimestamp();
    const result = await queryOne<RecommendationExclusionProps>(
      `INSERT INTO "recommendationExclusion"
         ("organizationId", "storeId", "productId", "excludedProductId", scope, reason, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT ("organizationId", "storeId", "productId", "excludedProductId", scope) DO UPDATE SET reason = EXCLUDED.reason
       RETURNING *`,
      [props.organizationId, props.storeId ?? ALL_STORES, props.productId, props.excludedProductId, props.scope, props.reason, now, now],
    );
    if (!result) throw new Error('Failed to create recommendation exclusion');
    return result;
  }

  async delete(recommendationExclusionId: string): Promise<boolean> {
    const result = await queryOne<{ recommendationExclusionId: string }>(
      `DELETE FROM "recommendationExclusion" WHERE "recommendationExclusionId" = $1 RETURNING "recommendationExclusionId"`,
      [recommendationExclusionId],
    );
    return !!result;
  }

  async listForProducts(scope: SignalScope, productIds: string[]): Promise<RecommendationExclusionProps[]> {
    const rows = await query<RecommendationExclusionProps[]>(
      `SELECT * FROM "recommendationExclusion"
       WHERE "organizationId" = $1 AND "storeId" = $2 AND ("productId" = ANY($3) OR scope = 'global')`,
      [scope.organizationId, scope.storeId ?? ALL_STORES, productIds],
    );
    return rows || [];
  }
}

export const recommendationRuleRepo = new RecommendationRuleRepository();
export const recommendationExclusionRepo = new RecommendationExclusionRepository();
