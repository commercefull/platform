/**
 * Business Repository Implementation
 * PostgreSQL implementation for business persistence
 */

import { query, queryOne } from '../../../../libs/db';
import { BusinessRepository as IBusinessRepository, BusinessFilters } from '../../domain/repositories/BusinessRepository';
import { Business } from '../../domain/entities/Business';

export class BusinessRepo implements IBusinessRepository {

  async findById(businessId: string): Promise<Business | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM business WHERE "businessId" = $1',
      [businessId]
    );
    return row ? this.mapToBusiness(row) : null;
  }

  async findBySlug(slug: string): Promise<Business | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM business WHERE slug = $1',
      [slug]
    );
    return row ? this.mapToBusiness(row) : null;
  }

  async findByDomain(domain: string): Promise<Business | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM business WHERE domain = $1',
      [domain]
    );
    return row ? this.mapToBusiness(row) : null;
  }

  async findAll(filters?: BusinessFilters): Promise<Business[]> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM business ${whereClause} ORDER BY "createdAt" DESC`,
      params
    );

    return (rows || []).map(row => this.mapToBusiness(row));
  }

  async save(business: Business): Promise<Business> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "businessId" FROM business WHERE "businessId" = $1',
      [business.businessId]
    );

    if (existing) {
      await query(
        `UPDATE business SET
          name = $1, slug = $2, description = $3, "businessType" = $4, domain = $5,
          logo = $6, "favicon" = $7, "primaryColor" = $8, "secondaryColor" = $9,
          "isActive" = $10, "allowMultipleStores" = $11, "allowMultipleWarehouses" = $12,
          "enableMarketplace" = $13, "defaultCurrency" = $14, "defaultLanguage" = $15,
          timezone = $16, metadata = $17, "updatedAt" = $18
        WHERE "businessId" = $19`,
        [
          business.name, business.slug, business.description, business.businessType,
          business.domain, business.logo, business.favicon, business.primaryColor,
          business.secondaryColor, business.isActive,
          business.settings.allowMultipleStores, business.settings.allowMultipleWarehouses,
          business.settings.enableMarketplace, business.settings.defaultCurrency,
          business.settings.defaultLanguage, business.settings.timezone,
          JSON.stringify(business.metadata || {}), now, business.businessId
        ]
      );
    } else {
      await query(
        `INSERT INTO business (
          "businessId", name, slug, description, "businessType", domain,
          logo, "favicon", "primaryColor", "secondaryColor", "isActive",
          "allowMultipleStores", "allowMultipleWarehouses", "enableMarketplace",
          "defaultCurrency", "defaultLanguage", timezone, metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          business.businessId, business.name, business.slug, business.description,
          business.businessType, business.domain, business.logo, business.favicon,
          business.primaryColor, business.secondaryColor, business.isActive,
          business.settings.allowMultipleStores, business.settings.allowMultipleWarehouses,
          business.settings.enableMarketplace, business.settings.defaultCurrency,
          business.settings.defaultLanguage, business.settings.timezone,
          JSON.stringify(business.metadata || {}), now, now
        ]
      );
    }

    return business;
  }

  async delete(businessId: string): Promise<void> {
    await query('DELETE FROM business WHERE "businessId" = $1', [businessId]);
  }

  async count(filters?: BusinessFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM business ${whereClause}`,
      params
    );
    return parseInt(result?.count || '0');
  }

  async findActive(): Promise<Business[]> {
    return this.findAll({ isActive: true });
  }

  async findByType(businessType: string): Promise<Business[]> {
    return this.findAll({ businessType });
  }

  private buildWhereClause(filters?: BusinessFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.businessType) {
      conditions.push(`"businessType" = $${paramIndex++}`);
      params.push(filters.businessType);
    }
    if (filters?.isActive !== undefined) {
      conditions.push(`"isActive" = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  private mapToBusiness(row: Record<string, any>): Business {
    return Business.reconstitute({
      businessId: row.businessId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      businessType: row.businessType,
      domain: row.domain,
      logo: row.logo,
      favicon: row.favicon,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
      isActive: Boolean(row.isActive),
      settings: {
        allowMultipleStores: Boolean(row.allowMultipleStores),
        allowMultipleWarehouses: Boolean(row.allowMultipleWarehouses),
        enableMarketplace: Boolean(row.enableMarketplace),
        defaultCurrency: row.defaultCurrency || 'USD',
        defaultLanguage: row.defaultLanguage || 'en',
        timezone: row.timezone || 'UTC'
      },
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}

export default new BusinessRepo();
