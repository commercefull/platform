/**
 * Store Repository Implementation
 * PostgreSQL implementation for store persistence
 */

import { query, queryOne } from '../../../../libs/db';
import type { Store as DbStore } from '../../../../libs/db/types';
import { StoreRepository as IStoreRepository, StoreFilters } from '../../domain/repositories/StoreRepository';
import { Store, type StoreProps } from '../../domain/entities/Store';
import { StoreNotFoundError } from '../../domain/errors/StoreErrors';

class StoreRepo implements IStoreRepository {
  async findById(storeId: string): Promise<Store | null> {
    const row = await queryOne<DbStore>('SELECT * FROM store WHERE "storeId" = $1', [storeId]);
    return row ? this.mapToStore(row) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const row = await queryOne<DbStore>('SELECT * FROM store WHERE slug = $1', [slug]);
    return row ? this.mapToStore(row) : null;
  }

  async findByUrl(storeUrl: string): Promise<Store | null> {
    const row = await queryOne<DbStore>('SELECT * FROM store WHERE "storeUrl" = $1', [storeUrl]);
    return row ? this.mapToStore(row) : null;
  }

  async findAll(filters?: StoreFilters): Promise<Store[]> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const rows = await query<DbStore[]>(`SELECT * FROM store ${whereClause} ORDER BY "createdAt" DESC`, params);

    return (rows || []).map(row => this.mapToStore(row));
  }

  async save(store: Store): Promise<Store> {
    const now = new Date().toISOString();

    const existing = await queryOne<Pick<DbStore, 'storeId'>>('SELECT "storeId" FROM store WHERE "storeId" = $1', [store.storeId]);

    if (existing) {
      await this.updateStoreRow(store, now);
    } else {
      await this.insertStoreRow(store, now);
    }

    return store;
  }

  private async updateStoreRow(store: Store, now: string): Promise<void> {
    const v = this.storeRowValues(store);
    await query(
      `UPDATE store SET
          name = $1, slug = $2, description = $3, "storeType" = $4, channel = $5,
          "organizationId" = $6, "storeUrl" = $7, "storeEmail" = $8,
          "storePhone" = $9, logo = $10, banner = $11, "favicon" = $12,
          "primaryColor" = $13, "secondaryColor" = $14, theme = $15, "colorScheme" = $16,
          address = $17, "isActive" = $18, "isVerified" = $19, "isFeatured" = $20,
          "storeRating" = $21, "reviewCount" = $22, "followerCount" = $23,
          "productCount" = $24, "orderCount" = $25, "storePolicies" = $26,
          "shippingMethods" = $27, "paymentMethods" = $28,
          settings = $29, "metaTitle" = $30, "metaDescription" = $31,
          "metaKeywords" = $32, "socialLinks" = $33, "openingHours" = $34,
          "customPages" = $35, "customFields" = $36, metadata = $37, "updatedAt" = $38
        WHERE "storeId" = $39`,
      [
        v.name,
        v.slug,
        v.description,
        v.storeType,
        v.channel,
        v.organizationId,
        v.storeUrl,
        v.storeEmail,
        v.storePhone,
        v.logo,
        v.banner,
        v.favicon,
        v.primaryColor,
        v.secondaryColor,
        v.theme,
        v.colorScheme,
        v.address,
        v.isActive,
        v.isVerified,
        v.isFeatured,
        v.storeRating,
        v.reviewCount,
        v.followerCount,
        v.productCount,
        v.orderCount,
        v.storePolicies,
        v.shippingMethods,
        v.paymentMethods,
        v.settings,
        v.metaTitle,
        v.metaDescription,
        v.metaKeywords,
        v.socialLinks,
        v.openingHours,
        v.customPages,
        v.customFields,
        v.metadata,
        now,
        store.storeId,
      ],
    );
  }

  private async insertStoreRow(store: Store, now: string): Promise<void> {
    const v = this.storeRowValues(store);
    await query(
      `INSERT INTO store (
          "storeId", name, slug, description, "storeType", channel,
          "organizationId", "storeUrl", "storeEmail", "storePhone",
          logo, banner, "favicon", "primaryColor", "secondaryColor", theme, "colorScheme",
          address, "isActive", "isVerified", "isFeatured", "storeRating", "reviewCount",
          "followerCount", "productCount", "orderCount", "storePolicies", "shippingMethods",
          "paymentMethods", settings,
          "metaTitle", "metaDescription", "metaKeywords", "socialLinks", "openingHours",
          "customPages", "customFields", metadata, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
          $34, $35, $36, $37, $38, $39, $40
        )`,
      [
        store.storeId,
        v.name,
        v.slug,
        v.description,
        v.storeType,
        v.channel,
        v.organizationId,
        v.storeUrl,
        v.storeEmail,
        v.storePhone,
        v.logo,
        v.banner,
        v.favicon,
        v.primaryColor,
        v.secondaryColor,
        v.theme,
        v.colorScheme,
        v.address,
        v.isActive,
        v.isVerified,
        v.isFeatured,
        v.storeRating,
        v.reviewCount,
        v.followerCount,
        v.productCount,
        v.orderCount,
        v.storePolicies,
        v.shippingMethods,
        v.paymentMethods,
        v.settings,
        v.metaTitle,
        v.metaDescription,
        v.metaKeywords,
        v.socialLinks,
        v.openingHours,
        v.customPages,
        v.customFields,
        v.metadata,
        now,
        now,
      ],
    );
  }

  private storeRowValues(store: Store) {
    return { ...this.storeCoreValues(store), ...this.storePolicyValues(store), ...this.storeMetaValues(store) };
  }

  private storeCoreValues(store: Store) {
    return {
      name: store.name,
      slug: store.slug,
      description: store.description,
      storeType: store.storeType,
      channel: store.channel,
      organizationId: store.organizationId,
      storeUrl: store.storeUrl,
      storeEmail: store.storeEmail,
      storePhone: store.storePhone,
      logo: store.logo,
      banner: store.banner,
      favicon: store.favicon,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
      theme: store.theme,
      colorScheme: JSON.stringify(store.colorScheme || {}),
      address: JSON.stringify(store.address),
      isActive: store.isActive,
      isVerified: store.isVerified,
      isFeatured: store.isFeatured,
      storeRating: store.storeRating,
      reviewCount: store.reviewCount,
      followerCount: store.followerCount,
      productCount: store.productCount,
      orderCount: store.orderCount,
    };
  }

  private storePolicyValues(store: Store) {
    return {
      storePolicies: JSON.stringify(store.storePolicies || {}),
      shippingMethods: store.shippingMethods || [],
      paymentMethods: store.paymentMethods || [],
      settings: JSON.stringify(store.settings || {}),
    };
  }

  private storeMetaValues(store: Store) {
    return {
      metaTitle: store.metaTitle,
      metaDescription: store.metaDescription,
      metaKeywords: store.metaKeywords || [],
      socialLinks: JSON.stringify(store.socialLinks || {}),
      openingHours: JSON.stringify(store.openingHours || {}),
      customPages: JSON.stringify(store.customPages || {}),
      customFields: JSON.stringify(store.customFields || {}),
      metadata: JSON.stringify(store.metadata || {}),
    };
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
    const row = await queryOne<DbStore>(
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

  async updatePickupSettings(storeId: string, pickupSettings: Record<string, unknown>): Promise<Store> {
    const row = await queryOne<DbStore>(
      `UPDATE store SET "settings" = COALESCE("settings", '{}'::jsonb) || jsonb_build_object('pickup', $1::jsonb), "updatedAt" = $2 WHERE "storeId" = $3 RETURNING *`,
      [JSON.stringify(pickupSettings), new Date().toISOString(), storeId],
    );
    if (!row) throw new StoreNotFoundError(storeId);
    return this.mapToStore(row);
  }

  async updateLocalDeliverySettings(storeId: string, deliverySettings: Record<string, unknown>): Promise<Store> {
    const row = await queryOne<DbStore>(
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
        "storeHierarchyId", "organizationId", "name", "defaultStoreId", "storeIds",
        "sharedInventoryPoolId", "sharedCatalogId", "settings", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)`,
      [
        input.hierarchyId,
        input.organizationId,
        input.name,
        input.defaultStoreId,
        JSON.stringify(input.storeIds),
        input.sharedInventoryPoolId || null,
        input.sharedCatalogId || null,
        JSON.stringify(input.settings || {}),
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

    const addIfTruthy = (column: string, value: unknown) => {
      if (!value) return;
      conditions.push(`"${column}" = $${paramIndex++}`);
      params.push(value);
    };
    const addIfDefined = (column: string, value: unknown) => {
      if (value === undefined) return;
      conditions.push(`"${column}" = $${paramIndex++}`);
      params.push(value);
    };

    addIfTruthy('storeType', filters?.storeType);
    addIfTruthy('organizationId', filters?.organizationId);
    addIfDefined('isHeadquarters', filters?.isHeadquarters);
    addIfTruthy('parentStoreId', filters?.parentStoreId);
    addIfDefined('isActive', filters?.isActive);
    addIfDefined('isVerified', filters?.isVerified);
    addIfDefined('isFeatured', filters?.isFeatured);

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToStore(row: Record<string, unknown>): Store {
    const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : v != null ? String(v) : undefined);
    const json = <T>(v: unknown): T | undefined => (typeof v === 'string' ? JSON.parse(v) : (v as T | undefined));
    return Store.reconstitute({
      storeId: str(row.storeId) as string,
      name: str(row.name) as string,
      slug: str(row.slug) as string,
      description: str(row.description),
      storeType: str(row.storeType) as 'merchant_store' | 'organization_store',
      channel: (str(row.channel) as StoreProps['channel']) || 'digital',
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
      colorScheme: json<Record<string, string>>(row.colorScheme),
      address: json<StoreProps['address']>(row.address),
      isActive: Boolean(row.isActive),
      isVerified: Boolean(row.isVerified),
      isFeatured: Boolean(row.isFeatured),
      storeRating: row.storeRating ? parseFloat(row.storeRating as string) : undefined,
      reviewCount: row.reviewCount ? parseInt(row.reviewCount as string) : undefined,
      followerCount: row.followerCount ? parseInt(row.followerCount as string) : undefined,
      productCount: row.productCount ? parseInt(row.productCount as string) : undefined,
      orderCount: row.orderCount ? parseInt(row.orderCount as string) : undefined,
      storePolicies: json<StoreProps['storePolicies']>(row.storePolicies),
      shippingMethods: json<string[]>(row.shippingMethods),
      paymentMethods: json<string[]>(row.paymentMethods),
      settings: json<StoreProps['settings']>(row.settings),
      metaTitle: str(row.metaTitle),
      metaDescription: str(row.metaDescription),
      metaKeywords: json<string[]>(row.metaKeywords),
      socialLinks: json<Record<string, string>>(row.socialLinks),
      openingHours: json<Record<string, unknown>>(row.openingHours),
      customPages: json<Record<string, unknown>>(row.customPages),
      customFields: json<Record<string, unknown>>(row.customFields),
      metadata: json<Record<string, unknown>>(row.metadata),
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }
}

export default new StoreRepo();
