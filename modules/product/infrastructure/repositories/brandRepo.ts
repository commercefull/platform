/**
 * Brand Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { Brand as DbBrand } from '../../../../libs/db/types';
import { BrandRepository as IBrandRepository, BrandFilters } from '../../domain/repositories/BrandRepository';
import { Brand, BrandStatus } from '../../domain/entities/Brand';
import { PaginatedResult, PaginationOptions } from 'libs/types/shared';

export class BrandRepo implements IBrandRepository {
  async findById(brandId: string): Promise<Brand | null> {
    const row = await queryOne<DbBrand>('SELECT * FROM brand WHERE "brandId" = $1 AND "deletedAt" IS NULL', [brandId]);
    if (!row) return null;
    return this.mapToBrand(row);
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const row = await queryOne<DbBrand>('SELECT * FROM brand WHERE slug = $1 AND "deletedAt" IS NULL', [slug]);
    if (!row) return null;
    return this.mapToBrand(row);
  }

  async findByOrganization(organizationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM brand WHERE "organizationId" = $1 AND "deletedAt" IS NULL',
      [organizationId],
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<DbBrand[]>(
      `SELECT * FROM brand WHERE "organizationId" = $1 AND "deletedAt" IS NULL
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset],
    );

    const brands: Brand[] = (rows || []).map(r => this.mapToBrand(r));
    return { data: brands, total, limit, offset, hasMore: offset + brands.length < total, length: brands.length };
  }

  async findAll(filters?: BrandFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM brand ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<DbBrand[]>(
      `SELECT * FROM brand ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const brands: Brand[] = (rows || []).map(r => this.mapToBrand(r));
    return { data: brands, total, limit, offset, hasMore: offset + brands.length < total, length: brands.length };
  }

  async findActive(organizationId?: string): Promise<Brand[]> {
    let rows: DbBrand[] | null;
    if (organizationId) {
      rows = await query<DbBrand[]>(
        'SELECT * FROM brand WHERE "organizationId" = $1 AND status = $2 AND "deletedAt" IS NULL ORDER BY name ASC',
        [organizationId, 'active'],
      );
    } else {
      rows = await query<DbBrand[]>('SELECT * FROM brand WHERE status = $1 AND "deletedAt" IS NULL ORDER BY name ASC', ['active']);
    }
    return (rows || []).map(r => this.mapToBrand(r));
  }

  async create(brand: Brand): Promise<Brand> {
    const json = brand.toJSON();
    await queryOne<DbBrand>(
      `INSERT INTO brand ("brandId", "organizationId", name, slug, description, "logoUrl", website, "countryOfOrigin", status, metadata, "externalId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        json.brandId,
        json.organizationId,
        json.name,
        json.slug,
        json.description || null,
        json.logoUrl || null,
        json.website || null,
        json.countryOfOrigin || null,
        json.status,
        JSON.stringify(json.metadata || {}),
        json.externalId || null,
        json.createdAt,
        json.updatedAt,
      ],
    );
    return brand;
  }

  async update(brand: Brand): Promise<Brand> {
    const json = brand.toJSON();
    await queryOne<DbBrand>(
      `UPDATE brand SET name = $1, slug = $2, description = $3, "logoUrl" = $4, website = $5, "countryOfOrigin" = $6, status = $7, metadata = $8, "externalId" = $9, "updatedAt" = $10
       WHERE "brandId" = $11 AND "deletedAt" IS NULL`,
      [
        json.name,
        json.slug,
        json.description || null,
        json.logoUrl || null,
        json.website || null,
        json.countryOfOrigin || null,
        json.status,
        JSON.stringify(json.metadata || {}),
        json.externalId || null,
        new Date(),
        json.brandId,
      ],
    );
    return brand;
  }

  async delete(brandId: string): Promise<void> {
    await queryOne<DbBrand>('UPDATE brand SET "deletedAt" = $1, status = $2 WHERE "brandId" = $3', [new Date(), 'archived', brandId]);
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM brand WHERE "organizationId" = $1 AND "deletedAt" IS NULL',
      [organizationId],
    );
    return parseInt(result?.count || '0');
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private buildWhereClause(filters?: BrandFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters?.organizationId) {
      conditions.push(`"organizationId" = $${paramIdx++}`);
      params.push(filters.organizationId);
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      const placeholders = statuses.map((_, i) => `$${paramIdx + i}`).join(', ');
      conditions.push(`status IN (${placeholders})`);
      params.push(...statuses);
      paramIdx += statuses.length;
    }

    if (filters?.search) {
      conditions.push(`(name ILIKE $${paramIdx++} OR description ILIKE $${paramIdx++})`);
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  private mapToBrand(row: DbBrand): Brand {
    let metadata: Record<string, unknown> | undefined;
    if (row.metadata && typeof row.metadata === 'object') {
      metadata = row.metadata as Record<string, unknown>;
    }

    return Brand.reconstitute({
      brandId: row.brandId,
      organizationId: row.organizationId,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      logoUrl: row.logoUrl || undefined,
      website: row.website || undefined,
      countryOfOrigin: row.countryOfOrigin || undefined,
      status: row.status as BrandStatus,
      metadata,
      externalId: row.externalId || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt || undefined,
    });
  }
}

// Export singleton instance
export default new BrandRepo();
