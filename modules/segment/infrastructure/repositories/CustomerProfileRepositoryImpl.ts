import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import { CustomerProfile } from '../../domain/entities/CustomerProfile';
import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';
import { SegmentValidationError } from '../../domain/errors/SegmentErrors';

interface ProfileDbRow {
  customerProfileId: string;
  customerId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  status: string | null;
  tier: string | null;
  lifetimeValue: string;
  totalSpent: string;
  averageOrderValue: string;
  totalOrders: number;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  ordersLast30Days: number;
  ordersLast90Days: number;
  ordersLast12Months: number;
  productViews: number;
  cartCount: number;
  abandonedCarts: number;
  wishlistItemCount: number;
  reviewCount: number;
  averageReviewRating: string | null;
  visitCount: number;
  lastVisitDate: Date | null;
  rfmSegment: string | null;
  engagementScore: string | null;
  churnRisk: string | null;
  riskScore: string | null;
  preferredCategories: string[] | null;
  preferredProducts: string[] | null;
  preferredPaymentMethods: string[] | null;
  preferredShippingMethods: string[] | null;
  deviceUsage: Record<string, unknown> | null;
  tags: string[] | null;
  customAttributes: Record<string, unknown> | null;
  segmentIds: string[] | null;
  organizationId: string | null;
  lastComputedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function rowToEntity(row: ProfileDbRow): CustomerProfile {
  return CustomerProfile.reconstitute({
    ...row,
    lifetimeValue: parseFloat(row.lifetimeValue),
    totalSpent: parseFloat(row.totalSpent),
    averageOrderValue: parseFloat(row.averageOrderValue),
    averageReviewRating: row.averageReviewRating ? parseFloat(row.averageReviewRating) : null,
    engagementScore: row.engagementScore ? parseFloat(row.engagementScore) : null,
    churnRisk: row.churnRisk ? parseFloat(row.churnRisk) : null,
    riskScore: row.riskScore ? parseFloat(row.riskScore) : null,
  });
}

export class CustomerProfileRepositoryImpl implements CustomerProfileRepository {
  async findByCustomerId(customerId: string): Promise<CustomerProfile | null> {
    const row = await queryOne<ProfileDbRow>(
      `SELECT * FROM "customerProfile" WHERE "customerId" = $1`,
      [customerId],
    );
    return row ? rowToEntity(row) : null;
  }

  async findAll(limit = 50, offset = 0): Promise<CustomerProfile[]> {
    const rows = await query<ProfileDbRow[]>(
      `SELECT * FROM "customerProfile" ORDER BY "updatedAt" DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return (rows || []).map(rowToEntity);
  }

  async findBySegment(segmentId: string): Promise<CustomerProfile[]> {
    const rows = await query<ProfileDbRow[]>(
      `SELECT cp.* FROM "customerProfile" cp
       INNER JOIN "segmentMembership" sm ON cp."customerId" = sm."customerId"
       WHERE sm."segmentId" = $1 AND sm."isActive" = true
       ORDER BY cp."lifetimeValue" DESC`,
      [segmentId],
    );
    return (rows || []).map(rowToEntity);
  }

  async findByTier(tier: string): Promise<CustomerProfile[]> {
    const rows = await query<ProfileDbRow[]>(
      `SELECT * FROM "customerProfile" WHERE "tier" = $1 ORDER BY "lifetimeValue" DESC`,
      [tier],
    );
    return (rows || []).map(rowToEntity);
  }

  async findByRFM(rfmSegment: string): Promise<CustomerProfile[]> {
    const rows = await query<ProfileDbRow[]>(
      `SELECT * FROM "customerProfile" WHERE "rfmSegment" = $1 ORDER BY "lifetimeValue" DESC`,
      [rfmSegment],
    );
    return (rows || []).map(rowToEntity);
  }

  async upsert(profile: CustomerProfile): Promise<CustomerProfile> {
    const p = profile.toJSON();
    const row = await queryOne<ProfileDbRow>(
      `INSERT INTO "customerProfile" (
        "customerId", "email", "firstName", "lastName", "status", "tier",
        "lifetimeValue", "totalSpent", "averageOrderValue", "totalOrders",
        "firstOrderDate", "lastOrderDate", "daysSinceLastOrder",
        "ordersLast30Days", "ordersLast90Days", "ordersLast12Months",
        "productViews", "cartCount", "abandonedCarts", "wishlistItemCount",
        "reviewCount", "averageReviewRating", "visitCount", "lastVisitDate",
        "rfmSegment", "engagementScore", "churnRisk", "riskScore",
        "preferredCategories", "preferredProducts", "preferredPaymentMethods",
        "preferredShippingMethods", "deviceUsage", "tags", "customAttributes",
        "segmentIds", "organizationId", "lastComputedAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
        $32, $33, $34, $35, $36, $37, $38, $39
      )
      ON CONFLICT ("customerId") DO UPDATE SET
        "email" = EXCLUDED."email", "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName", "status" = EXCLUDED."status",
        "tier" = EXCLUDED."tier", "lifetimeValue" = EXCLUDED."lifetimeValue",
        "totalSpent" = EXCLUDED."totalSpent", "averageOrderValue" = EXCLUDED."averageOrderValue",
        "totalOrders" = EXCLUDED."totalOrders", "firstOrderDate" = EXCLUDED."firstOrderDate",
        "lastOrderDate" = EXCLUDED."lastOrderDate", "daysSinceLastOrder" = EXCLUDED."daysSinceLastOrder",
        "ordersLast30Days" = EXCLUDED."ordersLast30Days",
        "ordersLast90Days" = EXCLUDED."ordersLast90Days",
        "ordersLast12Months" = EXCLUDED."ordersLast12Months",
        "productViews" = EXCLUDED."productViews", "cartCount" = EXCLUDED."cartCount",
        "abandonedCarts" = EXCLUDED."abandonedCarts",
        "wishlistItemCount" = EXCLUDED."wishlistItemCount",
        "reviewCount" = EXCLUDED."reviewCount",
        "averageReviewRating" = EXCLUDED."averageReviewRating",
        "visitCount" = EXCLUDED."visitCount", "lastVisitDate" = EXCLUDED."lastVisitDate",
        "rfmSegment" = EXCLUDED."rfmSegment",
        "engagementScore" = EXCLUDED."engagementScore",
        "churnRisk" = EXCLUDED."churnRisk", "riskScore" = EXCLUDED."riskScore",
        "preferredCategories" = EXCLUDED."preferredCategories",
        "preferredProducts" = EXCLUDED."preferredProducts",
        "preferredPaymentMethods" = EXCLUDED."preferredPaymentMethods",
        "preferredShippingMethods" = EXCLUDED."preferredShippingMethods",
        "deviceUsage" = EXCLUDED."deviceUsage", "tags" = EXCLUDED."tags",
        "customAttributes" = EXCLUDED."customAttributes",
        "segmentIds" = EXCLUDED."segmentIds",
        "organizationId" = EXCLUDED."organizationId",
        "lastComputedAt" = EXCLUDED."lastComputedAt",
        "updatedAt" = NOW()
      RETURNING *`,
      [
        p.customerId, p.email, p.firstName, p.lastName, p.status, p.tier,
        p.lifetimeValue, p.totalSpent, p.averageOrderValue, p.totalOrders,
        p.firstOrderDate, p.lastOrderDate, p.daysSinceLastOrder,
        p.ordersLast30Days, p.ordersLast90Days, p.ordersLast12Months,
        p.productViews, p.cartCount, p.abandonedCarts, p.wishlistItemCount,
        p.reviewCount, p.averageReviewRating, p.visitCount, p.lastVisitDate,
        p.rfmSegment, p.engagementScore, p.churnRisk, p.riskScore,
        p.preferredCategories ? JSON.stringify(p.preferredCategories) : null,
        p.preferredProducts ? JSON.stringify(p.preferredProducts) : null,
        p.preferredPaymentMethods ? JSON.stringify(p.preferredPaymentMethods) : null,
        p.preferredShippingMethods ? JSON.stringify(p.preferredShippingMethods) : null,
        p.deviceUsage ? JSON.stringify(p.deviceUsage) : null,
        p.tags ? JSON.stringify(p.tags) : null,
        p.customAttributes ? JSON.stringify(p.customAttributes) : null,
        p.segmentIds ? JSON.stringify(p.segmentIds) : null,
        p.organizationId, p.lastComputedAt, p.updatedAt,
      ],
    );
    if (!row) throw new SegmentValidationError('Failed to upsert customer profile');
    return rowToEntity(row);
  }

  async updateAggregates(customerId: string, aggregates: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [customerId];
    let paramIndex = 2;

    const fields = [
      'lifetimeValue', 'totalSpent', 'averageOrderValue', 'totalOrders',
      'firstOrderDate', 'lastOrderDate', 'daysSinceLastOrder',
      'ordersLast30Days', 'ordersLast90Days', 'ordersLast12Months',
      'productViews', 'cartCount', 'abandonedCarts', 'wishlistItemCount',
      'reviewCount', 'averageReviewRating', 'visitCount', 'lastVisitDate',
      'rfmSegment', 'engagementScore', 'churnRisk', 'riskScore', 'tier',
    ];

    for (const field of fields) {
      const value = (aggregates as unknown as Record<string, unknown>)[field];
      if (value !== undefined) {
        setClauses.push(`"${field}" = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (setClauses.length === 0) return this.findByCustomerId(customerId);

    setClauses.push(`"lastComputedAt" = NOW()`, `"updatedAt" = NOW()`);

    const row = await queryOne<ProfileDbRow>(
      `UPDATE "customerProfile" SET ${setClauses.join(', ')} WHERE "customerId" = $1 RETURNING *`,
      params,
    );
    return row ? rowToEntity(row) : null;
  }

  async delete(customerId: string): Promise<boolean> {
    const row = await queryOne<{ customerId: string }>(
      `DELETE FROM "customerProfile" WHERE "customerId" = $1 RETURNING "customerId"`,
      [customerId],
    );
    return !!row;
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "customerProfile"`);
    return result ? parseInt(result.count, 10) : 0;
  }

  async computeAggregatesFromOrder(customerId: string): Promise<CustomerProfile | null> {
    // Compute aggregates from order table
    const orderStats = await queryOne<{
      totalOrders: string;
      totalSpent: string;
      avgOrderValue: string | null;
      firstOrderDate: Date | null;
      lastOrderDate: Date | null;
    }>(
      `SELECT
        COUNT(*) as "totalOrders",
        COALESCE(SUM("grandTotal"), 0) as "totalSpent",
        AVG("grandTotal") as "avgOrderValue",
        MIN("createdAt") as "firstOrderDate",
        MAX("createdAt") as "lastOrderDate"
       FROM "order" WHERE "customerId" = $1 AND "status" NOT IN ('cancelled')`,
      [customerId],
    );

    if (!orderStats) return null;

    const totalOrders = parseInt(orderStats.totalOrders, 10);
    const totalSpent = parseFloat(orderStats.totalSpent);
    const avgOrderValue = orderStats.avgOrderValue ? parseFloat(orderStats.avgOrderValue) : 0;
    const daysSinceLastOrder = orderStats.lastOrderDate
      ? Math.floor((Date.now() - new Date(orderStats.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Count recent orders
    const recentOrders = await queryOne<{
      last30: string;
      last90: string;
      last12m: string;
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as "last30",
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '90 days') as "last90",
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '365 days') as "last12m"
       FROM "order" WHERE "customerId" = $1 AND "status" NOT IN ('cancelled')`,
      [customerId],
    );

    const ordersLast30Days = recentOrders ? parseInt(recentOrders.last30, 10) : 0;
    const ordersLast90Days = recentOrders ? parseInt(recentOrders.last90, 10) : 0;
    const ordersLast12Months = recentOrders ? parseInt(recentOrders.last12m, 10) : 0;

    // Get or create profile
    let profile = await this.findByCustomerId(customerId);
    if (!profile) {
      profile = CustomerProfile.create({ customerId });
    }

    profile.updateAggregates({
      totalOrders,
      totalSpent,
      averageOrderValue: avgOrderValue,
      lifetimeValue: totalSpent,
      firstOrderDate: orderStats.firstOrderDate,
      lastOrderDate: orderStats.lastOrderDate,
      daysSinceLastOrder,
      ordersLast30Days,
      ordersLast90Days,
      ordersLast12Months,
    });

    profile.computeRFM();

    return this.upsert(profile);
  }

  async recomputeAll(): Promise<number> {
    const customerIds = await query<{ customerId: string }[]>(
      `SELECT DISTINCT "customerId" FROM "order" WHERE "customerId" IS NOT NULL AND "status" NOT IN ('cancelled')`,
    );

    if (!customerIds || customerIds.length === 0) return 0;

    let count = 0;
    for (const { customerId } of customerIds) {
      try {
        await this.computeAggregatesFromOrder(customerId);
        count++;
      } catch (error) {
        logger.warn('Failed to compute aggregates for customer', { customerId, error: (error as Error).message });
      }
    }

    logger.info('Recomputed customer profiles', { count });
    return count;
  }
}
