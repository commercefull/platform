/**
 * Supplier Repository
 * Manages supplier data with CRUD operations
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Table Constants
// ============================================================================

const TABLE = Table.Supplier;

// ============================================================================
// Types
// ============================================================================

export type SupplierStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'blacklisted';

export interface Supplier {
  supplierId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  isApproved: boolean;
  status: SupplierStatus;
  rating?: number;
  taxId?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  currency: string;
  minOrderValue?: number;
  leadTime?: number;
  notes?: string;
  categories?: string[];
  tags?: string[];
  customFields?: Record<string, any>;
}

export type SupplierCreateParams = Omit<Supplier, 'supplierId' | 'createdAt' | 'updatedAt'>;
export type SupplierUpdateParams = Partial<Omit<Supplier, 'supplierId' | 'code' | 'createdAt' | 'updatedAt'>>;

export interface SupplierFilters {
  status?: SupplierStatus;
  isActive?: boolean;
  isApproved?: boolean;
  minRating?: number;
  category?: string;
  tag?: string;
  currency?: string;
}

export class SupplierRepo {
  /**
   * Find supplier by ID
   */
  async findById(supplierId: string): Promise<Supplier | null> {
    return await queryOne<Supplier>(
      `SELECT * FROM "public"."supplier" WHERE "supplierId" = $1`,
      [supplierId]
    );
  }

  /**
   * Find supplier by code
   */
  async findByCode(code: string): Promise<Supplier | null> {
    return await queryOne<Supplier>(
      `SELECT * FROM "public"."supplier" WHERE "code" = $1`,
      [code]
    );
  }

  /**
   * Find all suppliers
   */
  async findAll(activeOnly: boolean = false, approvedOnly: boolean = false): Promise<Supplier[]> {
    let sql = `SELECT * FROM "public"."supplier" WHERE 1=1`;
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    if (approvedOnly) {
      sql += ` AND "isApproved" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Supplier[]>(sql);
    return results || [];
  }

  /**
   * Find suppliers with filters
   */
  async findWithFilters(filters: SupplierFilters, limit: number = 50, offset: number = 0): Promise<Supplier[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`"status" = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`"isActive" = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    if (filters.isApproved !== undefined) {
      conditions.push(`"isApproved" = $${paramIndex++}`);
      params.push(filters.isApproved);
    }

    if (filters.minRating) {
      conditions.push(`"rating" >= $${paramIndex++}`);
      params.push(filters.minRating);
    }

    if (filters.category) {
      conditions.push(`$${paramIndex++} = ANY("categories")`);
      params.push(filters.category);
    }

    if (filters.tag) {
      conditions.push(`$${paramIndex++} = ANY("tags")`);
      params.push(filters.tag);
    }

    if (filters.currency) {
      conditions.push(`"currency" = $${paramIndex++}`);
      params.push(filters.currency);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    params.push(limit, offset);

    const results = await query<Supplier[]>(
      `SELECT * FROM "public"."supplier" 
       ${whereClause}
       ORDER BY "name" ASC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return results || [];
  }

  /**
   * Find suppliers by status
   */
  async findByStatus(status: SupplierStatus): Promise<Supplier[]> {
    const results = await query<Supplier[]>(
      `SELECT * FROM "public"."supplier" WHERE "status" = $1 ORDER BY "name" ASC`,
      [status]
    );
    return results || [];
  }

  /**
   * Find approved suppliers
   */
  async findApproved(): Promise<Supplier[]> {
    const results = await query<Supplier[]>(
      `SELECT * FROM "public"."supplier" 
       WHERE "isApproved" = true AND "isActive" = true 
       ORDER BY "name" ASC`,
      []
    );
    return results || [];
  }

  /**
   * Find suppliers by category
   */
  async findByCategory(category: string): Promise<Supplier[]> {
    const results = await query<Supplier[]>(
      `SELECT * FROM "public"."supplier" 
       WHERE $1 = ANY("categories") AND "isActive" = true
       ORDER BY "name" ASC`,
      [category]
    );
    return results || [];
  }

  /**
   * Create supplier
   */
  async create(params: SupplierCreateParams): Promise<Supplier> {
    const now = unixTimestamp();

    // Check if code already exists
    const existing = await this.findByCode(params.code);
    if (existing) {
      throw new Error(`Supplier with code '${params.code}' already exists`);
    }

    const result = await queryOne<Supplier>(
      `INSERT INTO "public"."supplier" (
        "name", "code", "description", "website", "email", "phone",
        "isActive", "isApproved", "status", "rating", "taxId",
        "paymentTerms", "paymentMethod", "currency", "minOrderValue", "leadTime",
        "notes", "categories", "tags", "customFields",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
      RETURNING *`,
      [
        params.name,
        params.code,
        params.description || null,
        params.website || null,
        params.email || null,
        params.phone || null,
        params.isActive !== undefined ? params.isActive : true,
        params.isApproved !== undefined ? params.isApproved : false,
        params.status || 'pending',
        params.rating || null,
        params.taxId || null,
        params.paymentTerms || null,
        params.paymentMethod || null,
        params.currency || 'USD',
        params.minOrderValue || null,
        params.leadTime || null,
        params.notes || null,
        params.categories || null,
        params.tags || null,
        params.customFields ? JSON.stringify(params.customFields) : null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create supplier');
    }

    return result;
  }

  /**
   * Update supplier
   */
  async update(supplierId: string, params: SupplierUpdateParams): Promise<Supplier | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'customFields' && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(supplierId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(supplierId);

    const result = await queryOne<Supplier>(
      `UPDATE "public"."supplier" 
       SET ${updateFields.join(', ')}
       WHERE "supplierId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Update supplier status
   */
  async updateStatus(supplierId: string, status: SupplierStatus): Promise<Supplier | null> {
    return this.update(supplierId, { status });
  }

  /**
   * Approve supplier
   */
  async approve(supplierId: string): Promise<Supplier | null> {
    return this.update(supplierId, { isApproved: true, status: 'active' });
  }

  /**
   * Suspend supplier
   */
  async suspend(supplierId: string): Promise<Supplier | null> {
    return this.update(supplierId, { status: 'suspended', isActive: false });
  }

  /**
   * Blacklist supplier
   */
  async blacklist(supplierId: string): Promise<Supplier | null> {
    return this.update(supplierId, { status: 'blacklisted', isActive: false, isApproved: false });
  }

  /**
   * Activate supplier
   */
  async activate(supplierId: string): Promise<Supplier | null> {
    return this.update(supplierId, { isActive: true, status: 'active' });
  }

  /**
   * Deactivate supplier
   */
  async deactivate(supplierId: string): Promise<Supplier | null> {
    return this.update(supplierId, { isActive: false, status: 'inactive' });
  }

  /**
   * Update supplier rating
   */
  async updateRating(supplierId: string, rating: number): Promise<Supplier | null> {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    
    return this.update(supplierId, { rating });
  }

  /**
   * Add category to supplier
   */
  async addCategory(supplierId: string, category: string): Promise<Supplier | null> {
    const result = await queryOne<Supplier>(
      `UPDATE "public"."supplier" 
       SET "categories" = array_append("categories", $1), "updatedAt" = $2
       WHERE "supplierId" = $3
       RETURNING *`,
      [category, unixTimestamp(), supplierId]
    );

    return result;
  }

  /**
   * Remove category from supplier
   */
  async removeCategory(supplierId: string, category: string): Promise<Supplier | null> {
    const result = await queryOne<Supplier>(
      `UPDATE "public"."supplier" 
       SET "categories" = array_remove("categories", $1), "updatedAt" = $2
       WHERE "supplierId" = $3
       RETURNING *`,
      [category, unixTimestamp(), supplierId]
    );

    return result;
  }

  /**
   * Add tag to supplier
   */
  async addTag(supplierId: string, tag: string): Promise<Supplier | null> {
    const result = await queryOne<Supplier>(
      `UPDATE "public"."supplier" 
       SET "tags" = array_append("tags", $1), "updatedAt" = $2
       WHERE "supplierId" = $3
       RETURNING *`,
      [tag, unixTimestamp(), supplierId]
    );

    return result;
  }

  /**
   * Remove tag from supplier
   */
  async removeTag(supplierId: string, tag: string): Promise<Supplier | null> {
    const result = await queryOne<Supplier>(
      `UPDATE "public"."supplier" 
       SET "tags" = array_remove("tags", $1), "updatedAt" = $2
       WHERE "supplierId" = $3
       RETURNING *`,
      [tag, unixTimestamp(), supplierId]
    );

    return result;
  }

  /**
   * Delete supplier
   */
  async delete(supplierId: string): Promise<boolean> {
    const result = await queryOne<{ supplierId: string }>(
      `DELETE FROM "public"."supplier" WHERE "supplierId" = $1 RETURNING "supplierId"`,
      [supplierId]
    );

    return !!result;
  }

  /**
   * Count suppliers
   */
  async count(filters?: SupplierFilters): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "public"."supplier"`;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters) {
      if (filters.status) {
        conditions.push(`"status" = $${paramIndex++}`);
        params.push(filters.status);
      }
      if (filters.isActive !== undefined) {
        conditions.push(`"isActive" = $${paramIndex++}`);
        params.push(filters.isActive);
      }
      if (filters.isApproved !== undefined) {
        conditions.push(`"isApproved" = $${paramIndex++}`);
        params.push(filters.isApproved);
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await queryOne<{ count: string }>(sql, params);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Search suppliers by name or description
   */
  async search(searchTerm: string, activeOnly: boolean = true): Promise<Supplier[]> {
    let sql = `SELECT * FROM "public"."supplier" 
               WHERE ("name" ILIKE $1 OR "description" ILIKE $1 OR "code" ILIKE $1)`;
    const params: any[] = [`%${searchTerm}%`];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Supplier[]>(sql, params);
    return results || [];
  }

  /**
   * Get supplier statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    approved: number;
    pending: number;
    suspended: number;
    blacklisted: number;
  }> {
    const total = await this.count();
    const active = await this.count({ isActive: true });
    const approved = await this.count({ isApproved: true });
    const pending = await this.count({ status: 'pending' });
    const suspended = await this.count({ status: 'suspended' });
    const blacklisted = await this.count({ status: 'blacklisted' });

    return {
      total,
      active,
      approved,
      pending,
      suspended,
      blacklisted
    };
  }
}

export default new SupplierRepo();
