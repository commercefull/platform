/**
 * Store Repository Implementation
 * PostgreSQL implementation for store persistence
 */

import { query, queryOne } from '../../../../libs/db';
import { StoreRepository as IStoreRepository, StoreFilters } from '../../domain/repositories/StoreRepository';
import { Store, type StoreProps } from '../../domain/entities/Store';
import { StoreNotFoundError } from '../../domain/errors/StoreErrors';

export class StoreRepo implements IStoreRepository {
  async findById(storeId: string): Promise<Store | null> {
    const row = await queryOne<Record<string, unknown>>('SELECT * FROM store WHERE "storeId" = $1', [storeId]);
    return row ? this.mapToStore(row) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const row = await queryOne<Record<string, unknown>>('SELECT * FROM store WHERE slug = $1', [slug]);
    return row ? this.mapToStore(row) : null;
  }

  async findByUrl(storeUrl: string): Promise<Store | null> {
    const row = await queryOne<Record<string, unknown>>('SELECT * FROM store WHERE "storeUrl" = $1', [storeUrl]);
    return row ? this.mapToStore(row) : null;
  }

  async findAll(filters?: StoreFilters): Promise<Store[]> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const rows = await query<Record<string, unknown>[]>(`SELECT * FROM store ${whereClause} ORDER BY "createdAt" DESC`, params);

    return (rows || []).map(row => this.mapToStore(row));
  }

  async save(store: Store): Promise<Store> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, unknown>>('SELECT "storeId" FROM store WHERE "storeId" = $1', [store.storeId]);

    if (existing) {
      await query(
        `UPDATE store SET
          name = $1, slug = $2, description = $3, "storeType" = $4,
          "organizationId" = $5, "storeUrl" = $6, "storeEmail" = $7,
          "storePhone" = $8, logo = $9, banner = $10, "favicon" = $11,
          "primaryColor" = $12, "secondaryColor" = $13, theme = $14, "colorScheme" = $15,
          address = $16, "isActive" = $17, "isVerified" = $18, "isFeatured" = $19,
          "storeRating" = $20, "reviewCount" = $21, "followerCount" = $22,
          "productCount" = $23, "orderCount" = $24, "storePolicies" = $25,
          "shippingMethods" = $26, "paymentMethods" = $27, "supportedCurrencies" = $28,
          "defaultCurrency" = $29, settings = $30, "metaTitle" = $31, "metaDescription" = $32,
          "metaKeywords" = $33, "socialLinks" = $34, "openingHours" = $35,
          "customPages" = $36, "customFields" = $37, metadata = $38, "updatedAt" = $39
        WHERE "storeId" = $40`,
        [
          store.name,
          store.slug,
          store.description,
          store.storeType,
          store.organizationId,
          store.storeUrl,
          store.storeEmail,
          store.storePhone,
          store.logo,
          store.banner,
          store.favicon,
          store.primaryColor,
          store.secondaryColor,
          store.theme,
          JSON.stringify(store.colorScheme || {}),
          JSON.stringify(store.address),
          store.isActive,
          store.isVerified,
          store.isFeatured,
          store.storeRating,
          store.reviewCount,
          store.followerCount,
          store.productCount,
          store.orderCount,
          JSON.stringify(store.storePolicies || {}),
          store.shippingMethods || [],
          store.paymentMethods || [],
          store.supportedCurrencies || [],
          store.defaultCurrency,
          JSON.stringify(store.settings || {}),
          store.metaTitle,
          store.metaDescription,
          store.metaKeywords || [],
          JSON.stringify(store.socialLinks || {}),
          JSON.stringify(store.openingHours || {}),
          JSON.stringify(store.customPages || {}),
          JSON.stringify(store.customFields || {}),
          JSON.stringify(store.metadata || {}),
          now,
          store.storeId,
        ],
      );
    } else {
      await query(
        `INSERT INTO store (
          "storeId", name, slug, description, "storeType",
          "organizationId", "storeUrl", "storeEmail", "storePhone",
          logo, banner, "favicon", "primaryColor", "secondaryColor", theme, "colorScheme",
          address, "isActive", "isVerified", "isFeatured", "storeRating", "reviewCount",
          "followerCount", "productCount", "orderCount", "storePolicies", "shippingMethods",
          "paymentMethods", "supportedCurrencies", "defaultCurrency", settings,
          "metaTitle", "metaDescription", "metaKeywords", "socialLinks", "openingHours",
          "customPages", "customFields", metadata, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
          $34, $35, $36, $37, $38, $39, $40, $41
        )`,
        [
          store.storeId,
          store.name,
          store.slug,
          store.description,
          store.storeType,
          store.organizationId,
          store.storeUrl,
          store.storeEmail,
          store.storePhone,
          store.logo,
          store.banner,
          store.favicon,
          store.primaryColor,
          store.secondaryColor,
          store.theme,
          JSON.stringify(store.colorScheme || {}),
          JSON.stringify(store.address),
          store.isActive,
          store.isVerified,
          store.isFeatured,
          store.storeRating,
          store.reviewCount,
          store.followerCount,
          store.productCount,
          store.orderCount,
          JSON.stringify(store.storePolicies || {}),
          store.shippingMethods || [],
          store.paymentMethods || [],
          store.supportedCurrencies || [],
          store.defaultCurrency,
          JSON.stringify(store.settings || {}),
          store.metaTitle,
          store.metaDescription,
          store.metaKeywords || [],
          JSON.stringify(store.socialLinks || {}),
          JSON.stringify(store.openingHours || {}),
          JSON.stringify(store.customPages || {}),
          JSON.stringify(store.customFields || {}),
          JSON.stringify(store.metadata || {}),
          now,
          now,
        ],
      );
    }

    return store;
  }

  async delete(storeId: string): Promise<void> {
    await query('DELETE FROM store WHERE "storeId" = $1', [storeId]);
  }

  async count(filters?: StoreFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM store ${whereClause}`, params);
    return parseInt(result?.count || '0');
  }

  async findByMerchant(organizationId: string): Promise<Store[]> {
    return this.findAll({ organizationId });
  }

  async findByBusiness(organizationId: string): Promise<Store[]> {
    return this.findAll({ organizationId });
  }

  async findHeadquarters(organizationId: string): Promise<Store | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM store WHERE "organizationId" = $1 AND "isHeadquarters" = true ORDER BY "createdAt" ASC LIMIT 1',
      [organizationId],
    );

    return row ? this.mapToStore(row) : null;
  }

  async findOutlets(parentStoreId: string): Promise<Store[]> {
    return this.findAll({ parentStoreId, isHeadquarters: false });
  }

  async findActive(): Promise<Store[]> {
    return this.findAll({ isActive: true });
  }

  async findFeatured(): Promise<Store[]> {
    return this.findAll({ isFeatured: true });
  }

  async findByType(storeType: string): Promise<Store[]> {
    return this.findAll({ storeType });
  }

  async updateStats(
    storeId: string,
    stats: {
      productCount?: number;
      orderCount?: number;
      reviewCount?: number;
      followerCount?: number;
    },
  ): Promise<void> {
    const setClauses: string[] = ['"updatedAt" = $1'];
    const params: unknown[] = [new Date().toISOString()];
    let paramIndex = 2;

    if (stats.productCount !== undefined) {
      setClauses.push(`"productCount" = $${paramIndex++}`);
      params.push(stats.productCount);
    }
    if (stats.orderCount !== undefined) {
      setClauses.push(`"orderCount" = $${paramIndex++}`);
      params.push(stats.orderCount);
    }
    if (stats.reviewCount !== undefined) {
      setClauses.push(`"reviewCount" = $${paramIndex++}`);
      params.push(stats.reviewCount);
    }
    if (stats.followerCount !== undefined) {
      setClauses.push(`"followerCount" = $${paramIndex++}`);
      params.push(stats.followerCount);
    }

    params.push(storeId);
    await query(`UPDATE store SET ${setClauses.join(', ')} WHERE "storeId" = $${paramIndex}`, params);
  }

  async updatePickupSettings(
    storeId: string,
    pickupSettings: Record<string, unknown>,
  ): Promise<Store> {
    const row = await queryOne<Record<string, unknown>>(
      `UPDATE store SET "settings" = COALESCE("settings", '{}'::jsonb) || jsonb_build_object('pickup', $1::jsonb), "updatedAt" = $2 WHERE "storeId" = $3 RETURNING *`,
      [JSON.stringify(pickupSettings), new Date().toISOString(), storeId],
    );
    if (!row) throw new StoreNotFoundError(storeId);
    return this.mapToStore(row);
  }

  async updateLocalDeliverySettings(
    storeId: string,
    deliverySettings: Record<string, unknown>,
  ): Promise<Store> {
    const row = await queryOne<Record<string, unknown>>(
      `UPDATE store SET "settings" = COALESCE("settings", '{}'::jsonb) || jsonb_build_object('localDelivery', $1::jsonb), "updatedAt" = $2 WHERE "storeId" = $3 RETURNING *`,
      [JSON.stringify(deliverySettings), new Date().toISOString(), storeId],
    );
    if (!row) throw new StoreNotFoundError(storeId);
    return this.mapToStore(row);
  }

  async createHierarchy(input: {
    hierarchyId: string;
    organizationId: string;
    name: string;
    defaultStoreId: string;
    storeIds: string[];
    sharedInventoryPoolId?: string;
    sharedCatalogId?: string;
    settings?: {
      allowCrossStoreTransfers: boolean;
      allowCrossStoreFulfillment: boolean;
      centralizedPricing: boolean;
    };
  }): Promise<{
    hierarchyId: string;
    organizationId: string;
    name: string;
    defaultStoreId: string;
    createdAt: Date;
  }> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "storeHierarchy" (
        "storeHierarchyId", "organizationId", "defaultStoreId",
        "sharedInventoryPoolId", "sharedCatalogId", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, true, $6, $7)`,
      [
        input.hierarchyId,
        input.organizationId,
        input.defaultStoreId,
        input.sharedInventoryPoolId || null,
        input.sharedCatalogId || null,
        now,
        now,
      ],
    );

    return {
      hierarchyId: input.hierarchyId,
      organizationId: input.organizationId,
      name: input.name,
      defaultStoreId: input.defaultStoreId,
      createdAt: new Date(now),
    };
  }

  private buildWhereClause(filters?: StoreFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.storeType) {
      conditions.push(`"storeType" = $${paramIndex++}`);
      params.push(filters.storeType);
    }
    if (filters?.organizationId) {
      conditions.push(`"organizationId" = $${paramIndex++}`);
      params.push(filters.organizationId);
    }
    if (filters?.isHeadquarters !== undefined) {
      conditions.push(`"isHeadquarters" = $${paramIndex++}`);
      params.push(filters.isHeadquarters);
    }
    if (filters?.parentStoreId) {
      conditions.push(`"parentStoreId" = $${paramIndex++}`);
      params.push(filters.parentStoreId);
    }
    if (filters?.isActive !== undefined) {
      conditions.push(`"isActive" = $${paramIndex++}`);
      params.push(filters.isActive);
    }
    if (filters?.isVerified !== undefined) {
      conditions.push(`"isVerified" = $${paramIndex++}`);
      params.push(filters.isVerified);
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(`"isFeatured" = $${paramIndex}`);
      params.push(filters.isFeatured);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToStore(row: Record<string, unknown>): Store {
    const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : v != null ? String(v) : undefined);
    return Store.reconstitute({
      storeId: str(row.storeId) as string,
      name: str(row.name) as string,
      slug: str(row.slug) as string,
      description: str(row.description),
      storeType: str(row.storeType) as 'merchant_store' | 'organization_store',
      organizationId: str(row.organizationId),
      isHeadquarters: Boolean(row.isHeadquarters),
      parentStoreId: str(row.parentStoreId) || undefined,
      storeUrl: str(row.storeUrl),
      storeEmail: str(row.storeEmail),
      storePhone: str(row.storePhone),
      logo: str(row.logo),
      banner: str(row.banner),
      favicon: str(row.favicon),
      primaryColor: str(row.primaryColor),
      secondaryColor: str(row.secondaryColor),
      theme: str(row.theme),
      colorScheme: typeof row.colorScheme === 'string' ? JSON.parse(row.colorScheme) : row.colorScheme as Record<string, string> | undefined,
      address: typeof row.address === 'string' ? JSON.parse(row.address) : row.address as StoreProps['address'],
      isActive: Boolean(row.isActive),
      isVerified: Boolean(row.isVerified),
      isFeatured: Boolean(row.isFeatured),
      storeRating: row.storeRating ? parseFloat(row.storeRating as string) : undefined,
      reviewCount: row.reviewCount ? parseInt(row.reviewCount as string) : undefined,
      followerCount: row.followerCount ? parseInt(row.followerCount as string) : undefined,
      productCount: row.productCount ? parseInt(row.productCount as string) : undefined,
      orderCount: row.orderCount ? parseInt(row.orderCount as string) : undefined,
      storePolicies: typeof row.storePolicies === 'string' ? JSON.parse(row.storePolicies) : row.storePolicies as StoreProps['storePolicies'],
      shippingMethods: typeof row.shippingMethods === 'string' ? JSON.parse(row.shippingMethods) : row.shippingMethods as string[] | undefined,
      paymentMethods: typeof row.paymentMethods === 'string' ? JSON.parse(row.paymentMethods) : row.paymentMethods as string[] | undefined,
      supportedCurrencies: typeof row.supportedCurrencies === 'string' ? JSON.parse(row.supportedCurrencies) : row.supportedCurrencies as string[] | undefined,
      defaultCurrency: str(row.defaultCurrency),
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings as StoreProps['settings'],
      metaTitle: str(row.metaTitle),
      metaDescription: str(row.metaDescription),
      metaKeywords: typeof row.metaKeywords === 'string' ? JSON.parse(row.metaKeywords) : row.metaKeywords as string[] | undefined,
      socialLinks: typeof row.socialLinks === 'string' ? JSON.parse(row.socialLinks) : row.socialLinks as Record<string, string> | undefined,
      openingHours: typeof row.openingHours === 'string' ? JSON.parse(row.openingHours) : row.openingHours as Record<string, unknown> | undefined,
      customPages: typeof row.customPages === 'string' ? JSON.parse(row.customPages) : row.customPages as Record<string, unknown> | undefined,
      customFields: typeof row.customFields === 'string' ? JSON.parse(row.customFields) : row.customFields as Record<string, unknown> | undefined,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }
}

export default new StoreRepo();
