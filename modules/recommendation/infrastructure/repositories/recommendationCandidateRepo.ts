/**
 * Candidate + popular serving read-model repositories.
 */

import { query, queryOne } from '../../../../libs/db';
import type { CandidateRepository, PopularRow } from '../../domain/repositories/CandidateRepository';
import type { SignalScope } from '../../domain/repositories/CoPurchaseRepository';
import type {
  CandidateSource,
  RecommendationCandidateInsert,
  RecommendationCandidateProps,
  RecommendationRelationType,
} from '../../domain/entities/RecommendationCandidate';
import { ALL_STORES } from './recommendationSignalRepo';

function storeKey(scope: SignalScope): string {
  return scope.storeId ?? ALL_STORES;
}

interface DbCandidateRow {
  recommendationCandidateId: string;
  organizationId: string;
  storeId: string;
  productId: string;
  candidateProductId: string;
  source: CandidateSource;
  relationType: RecommendationRelationType;
  score: string;
  reason: RecommendationCandidateProps['reason'];
  computedAt: string;
  createdAt: string;
}

function toProps(row: DbCandidateRow): RecommendationCandidateProps {
  return {
    ...row,
    storeId: row.storeId === ALL_STORES ? null : row.storeId,
    score: Number(row.score),
  };
}

export class RecommendationCandidateRepository implements CandidateRepository {
  async listForProducts(
    scope: SignalScope,
    productIds: string[],
    opts?: { source?: CandidateSource; relationType?: RecommendationRelationType; limit?: number },
  ): Promise<RecommendationCandidateProps[]> {
    if (productIds.length === 0) return [];
    let sql = `SELECT * FROM "recommendationCandidate"
      WHERE "organizationId" = $1 AND "storeId" = $2 AND "productId" = ANY($3)`;
    const params: unknown[] = [scope.organizationId, storeKey(scope), productIds];
    let i = 4;
    if (opts?.source) {
      sql += ` AND source = $${i++}`;
      params.push(opts.source);
    }
    if (opts?.relationType) {
      sql += ` AND "relationType" = $${i++}`;
      params.push(opts.relationType);
    }
    sql += ` ORDER BY score DESC LIMIT $${i}`;
    params.push(opts?.limit ?? 50);
    const rows = await query<DbCandidateRow[]>(sql, params);
    return (rows || []).map(toProps);
  }

  async listSuggestions(scope: SignalScope, productId: string, limit: number = 20): Promise<RecommendationCandidateProps[]> {
    const rows = await query<DbCandidateRow[]>(
      `SELECT * FROM "recommendationCandidate"
       WHERE "organizationId" = $1 AND "storeId" = $2 AND "productId" = $3
       ORDER BY score DESC LIMIT $4`,
      [scope.organizationId, storeKey(scope), productId, limit],
    );
    return (rows || []).map(toProps);
  }

  async replaceForSource(
    scope: SignalScope,
    source: CandidateSource,
    rows: RecommendationCandidateInsert[],
    runStartedAt: string,
  ): Promise<void> {
    for (const r of rows) {
      await query(
        `INSERT INTO "recommendationCandidate"
           ("organizationId", "storeId", "productId", "candidateProductId", "source", "relationType", "score", "reason", "computedAt", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT ("organizationId", "storeId", "productId", "candidateProductId", "source")
         DO UPDATE SET "relationType" = EXCLUDED."relationType", score = EXCLUDED.score,
           reason = EXCLUDED.reason, "computedAt" = EXCLUDED."computedAt"`,
        [
          scope.organizationId,
          storeKey(scope),
          r.productId,
          r.candidateProductId,
          r.source,
          r.relationType,
          r.score,
          JSON.stringify(r.reason ?? null),
          r.computedAt,
        ],
      );
    }
    // Swap: drop stale rows for this source not recomputed this run
    await query(
      `DELETE FROM "recommendationCandidate"
       WHERE "organizationId" = $1 AND "storeId" = $2 AND source = $3 AND "computedAt" < $4`,
      [scope.organizationId, storeKey(scope), source, runStartedAt],
    );
  }

  async listPopular(
    scope: SignalScope,
    popularScope: 'overall' | 'category',
    categoryId: string | null,
    limit: number,
  ): Promise<PopularRow[]> {
    const rows = await query<Array<{ scope: 'overall' | 'category'; categoryId: string; productId: string; rank: number; score: string }>>(
      `SELECT scope, "categoryId", "productId", rank, score FROM "recommendationPopular"
       WHERE "organizationId" = $1 AND "storeId" = $2 AND scope = $3 AND "categoryId" = $4
       ORDER BY rank ASC LIMIT $5`,
      [scope.organizationId, storeKey(scope), popularScope, categoryId ?? ALL_STORES, limit],
    );
    return (rows || []).map(r => ({ ...r, categoryId: r.categoryId === ALL_STORES ? null : r.categoryId, score: Number(r.score) }));
  }

  async replacePopular(
    scope: SignalScope,
    popularScope: 'overall' | 'category',
    categoryId: string | null,
    rows: PopularRow[],
  ): Promise<void> {
    await query(`DELETE FROM "recommendationPopular" WHERE "organizationId" = $1 AND "storeId" = $2 AND scope = $3 AND "categoryId" = $4`, [
      scope.organizationId,
      storeKey(scope),
      popularScope,
      categoryId ?? ALL_STORES,
    ]);
    for (const r of rows) {
      await query(
        `INSERT INTO "recommendationPopular" ("organizationId", "storeId", scope, "categoryId", "productId", rank, score, "computedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [scope.organizationId, storeKey(scope), popularScope, categoryId ?? ALL_STORES, r.productId, r.rank, r.score],
      );
    }
  }

  async deleteForProduct(organizationId: string, productId: string): Promise<void> {
    await query(`DELETE FROM "recommendationCandidate" WHERE "organizationId" = $1 AND ("productId" = $2 OR "candidateProductId" = $2)`, [
      organizationId,
      productId,
    ]);
    await query(`DELETE FROM "recommendationPopular" WHERE "organizationId" = $1 AND "productId" = $2`, [organizationId, productId]);
  }

  async getStats(scope: SignalScope): Promise<{ productsWithFbt: number; lastRebuiltAt: string | null; ordersCounted: number }> {
    const [fbt, rebuilt, counted] = await Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(DISTINCT "productId") as count FROM "recommendationCandidate"
         WHERE "organizationId" = $1 AND "storeId" = $2 AND source = 'fbt'`,
        [scope.organizationId, storeKey(scope)],
      ),
      queryOne<{ lastRebuiltAt: string | null }>(
        `SELECT "lastRebuiltAt" FROM "recommendationTenantStat" WHERE "organizationId" = $1 AND "storeId" = $2`,
        [scope.organizationId, storeKey(scope)],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM "recommendationProcessedOrder" WHERE "organizationId" = $1 AND status = 'counted'`,
        [scope.organizationId],
      ),
    ]);
    return {
      productsWithFbt: parseInt(fbt?.count ?? '0', 10),
      lastRebuiltAt: rebuilt?.lastRebuiltAt ?? null,
      ordersCounted: parseInt(counted?.count ?? '0', 10),
    };
  }

  async setLastRebuiltAt(scope: SignalScope, at: string): Promise<void> {
    await query(
      `INSERT INTO "recommendationTenantStat" ("organizationId", "storeId", "lastRebuiltAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT ("organizationId", "storeId") DO UPDATE SET "lastRebuiltAt" = $3, "updatedAt" = NOW()`,
      [scope.organizationId, storeKey(scope), at],
    );
  }
}

export default new RecommendationCandidateRepository();
