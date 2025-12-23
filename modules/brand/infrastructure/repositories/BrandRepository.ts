/**
 * Brand Repository Implementation
 * PostgreSQL implementation of the brand repository interface
 */

import { query, queryOne } from '../../../../libs/db';
import { Brand } from '../../domain/entities/Brand';
import { IBrandRepository, BrandFilters, PaginationOptions, PaginatedResult } from '../../domain/repositories/BrandRepository';

export class BrandRepository implements IBrandRepository {
  async save(brand: Brand): Promise<Brand> {
    const props = brand.toPersistence();
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>('SELECT "brandId" FROM brand WHERE "brandId" = $1', [props.brandId]);

    if (existing) {
      // Update
      await query(
        `UPDATE brand SET
          name = $1,
          slug = $2,
          description = $3,
          "logoMediaId" = $4,
          "coverImageMediaId" = $5,
          website = $6,
          "countryOfOrigin" = $7,
          "isActive" = $8,
          "isFeatured" = $9,
          "sortOrder" = $10,
          metadata = $11,
          "updatedAt" = $12
        WHERE "brandId" = $13`,
        [
          props.name,
          props.slug,
          props.description || null,
          props.logoMediaId || null,
          props.coverImageMediaId || null,
          props.website || null,
          props.countryOfOrigin || null,
          props.isActive,
          props.isFeatured,
          props.sortOrder,
          props.metadata ? JSON.stringify(props.metadata) : null,
          now,
          props.brandId,
        ],
      );
    } else {
      // Insert
      await query(
        `INSERT INTO brand (
          "brandId", name, slug, description, "logoMediaId",
          "coverImageMediaId", website, "countryOfOrigin", "isActive",
          "isFeatured", "sortOrder", metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          props.brandId,
          props.name,
          props.slug,
          props.description || null,
          props.logoMediaId || null,
          props.coverImageMediaId || null,
          props.website || null,
          props.countryOfOrigin || null,
          props.isActive,
          props.isFeatured,
          props.sortOrder,
          props.metadata ? JSON.stringify(props.metadata) : null,
          now,
          now,
        ],
      );
    }

    // Return the saved brand
    const saved = await this.findById(props.brandId);
    return saved!;
  }

  async findById(brandId: string): Promise<Brand | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM brand WHERE "brandId" = $1', [brandId]);

    if (!row) return null;
    return this.mapToBrand(row);
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM brand WHERE slug = $1', [slug]);

    if (!row) return null;
    return this.mapToBrand(row);
  }

  async findAll(filters?: BrandFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const { whereClause, params } = this.buildWhereClause(filters);

    // Get total count
    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM brand ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0', 10);

    // Get paginated data
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM brand ${whereClause}
       ORDER BY "sortOrder" ASC, name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const data = (rows || []).map(row => this.mapToBrand(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findFeatured(): Promise<Brand[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM brand WHERE "isFeatured" = true AND "isActive" = true ORDER BY "sortOrder" ASC',
      [],
    );

    return (rows || []).map(row => this.mapToBrand(row));
  }

  async delete(brandId: string): Promise<boolean> {
    const result = await query<{ rowCount?: number }>('DELETE FROM brand WHERE "brandId" = $1', [brandId]);

    return (result as any)?.rowCount > 0;
  }

  async count(filters?: BrandFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);

    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM brand ${whereClause}`, params);

    return parseInt(result?.count || '0', 10);
  }

  private buildWhereClause(filters?: BrandFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.isActive !== undefined) {
      conditions.push(`"isActive" = $${params.length + 1}`);
      params.push(filters.isActive);
    }

    if (filters?.isFeatured !== undefined) {
      conditions.push(`"isFeatured" = $${params.length + 1}`);
      params.push(filters.isFeatured);
    }

    if (filters?.search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
      params.push(`%${filters.search}%`);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToBrand(row: Record<string, any>): Brand {
    return Brand.fromPersistence({
      brandId: row.brandId,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      logoMediaId: row.logoMediaId || undefined,
      coverImageMediaId: row.coverImageMediaId || undefined,
      website: row.website || undefined,
      countryOfOrigin: row.countryOfOrigin || undefined,
      isActive: Boolean(row.isActive),
      isFeatured: Boolean(row.isFeatured),
      sortOrder: parseInt(row.sortOrder || '0', 10),
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export const brandRepository = new BrandRepository();
export default brandRepository;
