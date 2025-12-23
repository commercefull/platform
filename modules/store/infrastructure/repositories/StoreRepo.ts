/**
 * Store Repository Implementation
 * PostgreSQL implementation for store persistence
 */

import { query, queryOne } from '../../../../libs/db';
import { StoreRepository as IStoreRepository, StoreFilters } from '../../domain/repositories/StoreRepository';
import { Store } from '../../domain/entities/Store';

export class StoreRepo implements IStoreRepository {
  async findById(storeId: string): Promise<Store | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM store WHERE "storeId" = $1', [storeId]);
    return row ? this.mapToStore(row) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM store WHERE slug = $1', [slug]);
    return row ? this.mapToStore(row) : null;
  }

  async findByUrl(storeUrl: string): Promise<Store | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM store WHERE "storeUrl" = $1', [storeUrl]);
    return row ? this.mapToStore(row) : null;
  }

  async findAll(filters?: StoreFilters): Promise<Store[]> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const rows = await query<Record<string, any>[]>(`SELECT * FROM store ${whereClause} ORDER BY "createdAt" DESC`, params);

    return (rows || []).map(row => this.mapToStore(row));
  }

  async save(store: Store): Promise<Store> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>('SELECT "storeId" FROM store WHERE "storeId" = $1', [store.storeId]);

    if (existing) {
      await query(
        `UPDATE store SET
          name = $1, slug = $2, description = $3, "storeType" = $4,
          "merchantId" = $5, "businessId" = $6, "storeUrl" = $7, "storeEmail" = $8,
          "storePhone" = $9, logo = $10, banner = $11, "favicon" = $12,
          "primaryColor" = $13, "secondaryColor" = $14, theme = $15, "colorScheme" = $16,
          address = $17, "isActive" = $18, "isVerified" = $19, "isFeatured" = $20,
          "storeRating" = $21, "reviewCount" = $22, "followerCount" = $23,
          "productCount" = $24, "orderCount" = $25, "storePolicies" = $26,
          "shippingMethods" = $27, "paymentMethods" = $28, "supportedCurrencies" = $29,
          "defaultCurrency" = $30, settings = $31, "metaTitle" = $32, "metaDescription" = $33,
          "metaKeywords" = $34, "socialLinks" = $35, "openingHours" = $36,
          "customPages" = $37, "customFields" = $38, metadata = $39, "updatedAt" = $40
        WHERE "storeId" = $41`,
        [
          store.name,
          store.slug,
          store.description,
          store.storeType,
          store.merchantId,
          store.businessId,
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
          JSON.stringify(store.shippingMethods || []),
          JSON.stringify(store.paymentMethods || []),
          JSON.stringify(store.supportedCurrencies || []),
          store.defaultCurrency,
          JSON.stringify(store.settings || {}),
          store.metaTitle,
          store.metaDescription,
          JSON.stringify(store.metaKeywords || []),
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
          "merchantId", "businessId", "storeUrl", "storeEmail", "storePhone",
          logo, banner, "favicon", "primaryColor", "secondaryColor", theme, "colorScheme",
          address, "isActive", "isVerified", "isFeatured", "storeRating", "reviewCount",
          "followerCount", "productCount", "orderCount", "storePolicies", "shippingMethods",
          "paymentMethods", "supportedCurrencies", "defaultCurrency", settings,
          "metaTitle", "metaDescription", "metaKeywords", "socialLinks", "openingHours",
          "customPages", "customFields", metadata, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40, $41
        )`,
        [
          store.storeId,
          store.name,
          store.slug,
          store.description,
          store.storeType,
          store.merchantId,
          store.businessId,
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
          JSON.stringify(store.shippingMethods || []),
          JSON.stringify(store.paymentMethods || []),
          JSON.stringify(store.supportedCurrencies || []),
          store.defaultCurrency,
          JSON.stringify(store.settings || {}),
          store.metaTitle,
          store.metaDescription,
          JSON.stringify(store.metaKeywords || []),
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

  async findByMerchant(merchantId: string): Promise<Store[]> {
    return this.findAll({ merchantId });
  }

  async findByBusiness(businessId: string): Promise<Store[]> {
    return this.findAll({ businessId });
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
    const params: any[] = [new Date().toISOString()];
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

  private buildWhereClause(filters?: StoreFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.storeType) {
      conditions.push(`"storeType" = $${paramIndex++}`);
      params.push(filters.storeType);
    }
    if (filters?.merchantId) {
      conditions.push(`"merchantId" = $${paramIndex++}`);
      params.push(filters.merchantId);
    }
    if (filters?.businessId) {
      conditions.push(`"businessId" = $${paramIndex++}`);
      params.push(filters.businessId);
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
      conditions.push(`"isFeatured" = $${paramIndex++}`);
      params.push(filters.isFeatured);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToStore(row: Record<string, any>): Store {
    return Store.reconstitute({
      storeId: row.storeId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      storeType: row.storeType,
      merchantId: row.merchantId,
      businessId: row.businessId,
      storeUrl: row.storeUrl,
      storeEmail: row.storeEmail,
      storePhone: row.storePhone,
      logo: row.logo,
      banner: row.banner,
      favicon: row.favicon,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
      theme: row.theme,
      colorScheme: typeof row.colorScheme === 'string' ? JSON.parse(row.colorScheme) : row.colorScheme,
      address: typeof row.address === 'string' ? JSON.parse(row.address) : row.address,
      isActive: Boolean(row.isActive),
      isVerified: Boolean(row.isVerified),
      isFeatured: Boolean(row.isFeatured),
      storeRating: row.storeRating ? parseFloat(row.storeRating) : undefined,
      reviewCount: row.reviewCount ? parseInt(row.reviewCount) : undefined,
      followerCount: row.followerCount ? parseInt(row.followerCount) : undefined,
      productCount: row.productCount ? parseInt(row.productCount) : undefined,
      orderCount: row.orderCount ? parseInt(row.orderCount) : undefined,
      storePolicies: typeof row.storePolicies === 'string' ? JSON.parse(row.storePolicies) : row.storePolicies,
      shippingMethods: typeof row.shippingMethods === 'string' ? JSON.parse(row.shippingMethods) : row.shippingMethods,
      paymentMethods: typeof row.paymentMethods === 'string' ? JSON.parse(row.paymentMethods) : row.paymentMethods,
      supportedCurrencies: typeof row.supportedCurrencies === 'string' ? JSON.parse(row.supportedCurrencies) : row.supportedCurrencies,
      defaultCurrency: row.defaultCurrency,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      metaKeywords: typeof row.metaKeywords === 'string' ? JSON.parse(row.metaKeywords) : row.metaKeywords,
      socialLinks: typeof row.socialLinks === 'string' ? JSON.parse(row.socialLinks) : row.socialLinks,
      openingHours: typeof row.openingHours === 'string' ? JSON.parse(row.openingHours) : row.openingHours,
      customPages: typeof row.customPages === 'string' ? JSON.parse(row.customPages) : row.customPages,
      customFields: typeof row.customFields === 'string' ? JSON.parse(row.customFields) : row.customFields,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export default new StoreRepo();
