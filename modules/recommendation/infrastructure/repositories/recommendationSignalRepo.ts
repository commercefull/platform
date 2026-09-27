/**
 * Recommendation signal repositories — SQL implementations over
 * recommendationCoPurchase, recommendationProductStat,
 * recommendationTenantStat and the recommendationProcessedOrder ledger.
 * storeId uses the ALL_STORES sentinel when the scope is tenant-wide.
 */

import { query, queryOne } from '../../../../libs/db';
import type {
  CoPurchaseRepository,
  CoPurchaseRow,
  ProcessedOrderRecord,
  ProcessedOrderRepository,
  SignalScope,
} from '../../domain/repositories/CoPurchaseRepository';

export const ALL_STORES = '00000000-0000-0000-0000-000000000000';

function storeKey(scope: SignalScope): string {
  return scope.storeId ?? ALL_STORES;
}

interface DbCoPurchaseRow {
  productId: string;
  relatedProductId: string;
  coCount: string;
}

export class RecommendationSignalRepository implements CoPurchaseRepository {
  async incrementPairs(scope: SignalScope, productIds: string[], delta: number = 1): Promise<void> {
    if (productIds.length < 2) return;
    // Ordered pairs A≠B — unnest generates every (a,b) combination in one
    // statement; a 20-item order writes 380 rows.
    await query(
      `INSERT INTO "recommendationCoPurchase"
         ("organizationId", "storeId", "productId", "relatedProductId", "coCount", "lifetimeCoCount", "lastOrderedAt", "createdAt", "updatedAt")
       SELECT $1, $2, a, b, $4, GREATEST($4, 0), NOW(), NOW(), NOW()
       FROM unnest($3::uuid[]) a
       CROSS JOIN unnest($3::uuid[]) b
       WHERE a <> b
       ON CONFLICT ("organizationId", "storeId", "productId", "relatedProductId")
       DO UPDATE SET
         "coCount" = GREATEST("recommendationCoPurchase"."coCount" + $4, 0),
         "lifetimeCoCount" = "recommendationCoPurchase"."lifetimeCoCount" + GREATEST($4, 0),
         "lastOrderedAt" = NOW(),
         "updatedAt" = NOW()`,
      [scope.organizationId, storeKey(scope), productIds, delta],
    );
  }

  async decrementPairs(scope: SignalScope, productIds: string[]): Promise<void> {
    await this.incrementPairs(scope, productIds, -1);
  }

  async incrementProductCounts(scope: SignalScope, productIds: string[], delta: number = 1): Promise<void> {
    if (productIds.length === 0) return;
    await query(
      `INSERT INTO "recommendationProductStat"
         ("organizationId", "storeId", "productId", "orderCount", "lifetimeOrderCount", "lastOrderedAt", "createdAt", "updatedAt")
       SELECT $1, $2, p, $4, GREATEST($4, 0), NOW(), NOW(), NOW()
       FROM unnest($3::uuid[]) p
       ON CONFLICT ("organizationId", "storeId", "productId")
       DO UPDATE SET
         "orderCount" = GREATEST("recommendationProductStat"."orderCount" + $4, 0),
         "lifetimeOrderCount" = "recommendationProductStat"."lifetimeOrderCount" + GREATEST($4, 0),
         "lastOrderedAt" = NOW(),
         "updatedAt" = NOW()`,
      [scope.organizationId, storeKey(scope), productIds, delta],
    );
  }

  async incrementTotalOrders(scope: SignalScope, delta: number = 1): Promise<void> {
    await query(
      `INSERT INTO "recommendationTenantStat" ("organizationId", "storeId", "totalOrders", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT ("organizationId", "storeId")
       DO UPDATE SET "totalOrders" = GREATEST("recommendationTenantStat"."totalOrders" + $3, 0), "updatedAt" = NOW()`,
      [scope.organizationId, storeKey(scope), delta],
    );
  }

  async listPairsForProducts(scope: SignalScope, productIds: string[]): Promise<CoPurchaseRow[]> {
    if (productIds.length === 0) return [];
    const rows = await query<DbCoPurchaseRow[]>(
      `SELECT "productId", "relatedProductId", "coCount" FROM "recommendationCoPurchase"
       WHERE "organizationId" = $1 AND "storeId" = $2 AND "productId" = ANY($3)`,
      [scope.organizationId, storeKey(scope), productIds],
    );
    return (rows || []).map(r => ({ productId: r.productId, relatedProductId: r.relatedProductId, coCount: Number(r.coCount) }));
  }

  async listAllPairs(scope: SignalScope): Promise<CoPurchaseRow[]> {
    const rows = await query<DbCoPurchaseRow[]>(
      `SELECT "productId", "relatedProductId", "coCount" FROM "recommendationCoPurchase"
       WHERE "organizationId" = $1 AND "storeId" = $2`,
      [scope.organizationId, storeKey(scope)],
    );
    return (rows || []).map(r => ({ productId: r.productId, relatedProductId: r.relatedProductId, coCount: Number(r.coCount) }));
  }

  async listProductCounts(scope: SignalScope, productIds: string[]): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();
    const rows = await query<Array<{ productId: string; orderCount: string }>>(
      `SELECT "productId", "orderCount" FROM "recommendationProductStat"
       WHERE "organizationId" = $1 AND "storeId" = $2 AND "productId" = ANY($3)`,
      [scope.organizationId, storeKey(scope), productIds],
    );
    return new Map((rows || []).map(r => [r.productId, Number(r.orderCount)]));
  }

  async listAllProductCounts(scope: SignalScope): Promise<Map<string, number>> {
    const rows = await query<Array<{ productId: string; orderCount: string }>>(
      `SELECT "productId", "orderCount" FROM "recommendationProductStat"
       WHERE "organizationId" = $1 AND "storeId" = $2`,
      [scope.organizationId, storeKey(scope)],
    );
    return new Map((rows || []).map(r => [r.productId, Number(r.orderCount)]));
  }

  async getTotalOrders(scope: SignalScope): Promise<number> {
    const row = await queryOne<{ totalOrders: string }>(
      `SELECT "totalOrders" FROM "recommendationTenantStat" WHERE "organizationId" = $1 AND "storeId" = $2`,
      [scope.organizationId, storeKey(scope)],
    );
    return row ? Number(row.totalOrders) : 0;
  }

  async applyDecay(scope: SignalScope, factor: number, floor: number): Promise<void> {
    if (factor >= 1) return;
    const updateParams = [factor, scope.organizationId, storeKey(scope)];
    const deleteParams = [scope.organizationId, storeKey(scope), floor];
    await query(
      `UPDATE "recommendationCoPurchase" SET "coCount" = "coCount" * $1, "updatedAt" = NOW()
       WHERE "organizationId" = $2 AND "storeId" = $3`,
      updateParams,
    );
    await query(`DELETE FROM "recommendationCoPurchase" WHERE "organizationId" = $1 AND "storeId" = $2 AND "coCount" < $3`, deleteParams);
    await query(
      `UPDATE "recommendationProductStat" SET "orderCount" = "orderCount" * $1, "updatedAt" = NOW()
       WHERE "organizationId" = $2 AND "storeId" = $3`,
      updateParams,
    );
    await query(
      `DELETE FROM "recommendationProductStat" WHERE "organizationId" = $1 AND "storeId" = $2 AND "orderCount" < $3`,
      deleteParams,
    );
    await query(
      `UPDATE "recommendationTenantStat" SET "totalOrders" = "totalOrders" * $1, "updatedAt" = NOW()
       WHERE "organizationId" = $2 AND "storeId" = $3`,
      updateParams,
    );
  }
}

export class ProcessedOrderRepositoryImpl implements ProcessedOrderRepository {
  async get(orderId: string): Promise<ProcessedOrderRecord | null> {
    const row = await queryOne<{
      orderId: string;
      organizationId: string;
      storeId: string;
      productIds: string[];
      status: ProcessedOrderRecord['status'];
    }>(`SELECT * FROM "recommendationProcessedOrder" WHERE "orderId" = $1`, [orderId]);
    if (!row) return null;
    return {
      orderId: row.orderId,
      organizationId: row.organizationId,
      storeId: row.storeId === ALL_STORES ? null : row.storeId,
      productIds: row.productIds || [],
      status: row.status,
    };
  }

  async insert(record: ProcessedOrderRecord): Promise<void> {
    await query(
      `INSERT INTO "recommendationProcessedOrder" ("orderId", "organizationId", "storeId", "productIds", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("orderId") DO NOTHING`,
      [record.orderId, record.organizationId, record.storeId ?? ALL_STORES, record.productIds, record.status],
    );
  }

  async markStatus(orderId: string, status: ProcessedOrderRecord['status']): Promise<void> {
    await query(`UPDATE "recommendationProcessedOrder" SET status = $1, "updatedAt" = NOW() WHERE "orderId" = $2`, [status, orderId]);
  }
}

export default new RecommendationSignalRepository();
export const processedOrderRepo = new ProcessedOrderRepositoryImpl();
