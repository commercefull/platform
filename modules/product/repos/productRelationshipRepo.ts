import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type RelationType = 'related' | 'accessory' | 'bundle';

export interface ProductRelationship {
  productRelatedId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  relatedProductId: string;
  type: RelationType;
  position: number;
  isAutomated: boolean;
}

export type ProductRelationshipCreateParams = Omit<ProductRelationship, 'productRelatedId' | 'createdAt' | 'updatedAt'>;
export type ProductRelationshipUpdateParams = Partial<Pick<ProductRelationship, 'type' | 'position' | 'isAutomated'>>;

export class ProductRelationshipRepo {
  /**
   * Find relationship by ID
   */
  async findById(productRelatedId: string): Promise<ProductRelationship | null> {
    return await queryOne<ProductRelationship>(
      `SELECT * FROM "public"."productRelated" WHERE "productRelatedId" = $1`,
      [productRelatedId]
    );
  }

  /**
   * Find all relationships for a product
   */
  async findByProductId(productId: string, type?: RelationType): Promise<ProductRelationship[]> {
    let sql = `SELECT * FROM "public"."productRelated" WHERE "productId" = $1`;
    const params: any[] = [productId];
    
    if (type) {
      sql += ` AND "type" = $2`;
      params.push(type);
    }
    
    sql += ` ORDER BY "position" ASC, "createdAt" ASC`;
    
    const results = await query<ProductRelationship[]>(sql, params);
    return results || [];
  }

  /**
   * Find related products (products that are related TO this product)
   */
  async findRelatedProducts(productId: string, type?: RelationType): Promise<ProductRelationship[]> {
    return this.findByProductId(productId, type);
  }

  /**
   * Find reverse relationships (products that have this product as related)
   */
  async findReverseRelationships(productId: string, type?: RelationType): Promise<ProductRelationship[]> {
    let sql = `SELECT * FROM "public"."productRelated" WHERE "relatedProductId" = $1`;
    const params: any[] = [productId];
    
    if (type) {
      sql += ` AND "type" = $2`;
      params.push(type);
    }
    
    sql += ` ORDER BY "position" ASC, "createdAt" ASC`;
    
    const results = await query<ProductRelationship[]>(sql, params);
    return results || [];
  }

  /**
   * Find automated relationships
   */
  async findAutomatedByProductId(productId: string): Promise<ProductRelationship[]> {
    const results = await query<ProductRelationship[]>(
      `SELECT * FROM "public"."productRelated" 
       WHERE "productId" = $1 AND "isAutomated" = true 
       ORDER BY "position" ASC`,
      [productId]
    );
    return results || [];
  }

  /**
   * Find manual relationships
   */
  async findManualByProductId(productId: string): Promise<ProductRelationship[]> {
    const results = await query<ProductRelationship[]>(
      `SELECT * FROM "public"."productRelated" 
       WHERE "productId" = $1 AND "isAutomated" = false 
       ORDER BY "position" ASC`,
      [productId]
    );
    return results || [];
  }

  /**
   * Check if relationship exists
   */
  async exists(productId: string, relatedProductId: string, type: RelationType): Promise<boolean> {
    const result = await queryOne<{ productRelatedId: string }>(
      `SELECT "productRelatedId" FROM "public"."productRelated" 
       WHERE "productId" = $1 AND "relatedProductId" = $2 AND "type" = $3`,
      [productId, relatedProductId, type]
    );

    return !!result;
  }

  /**
   * Create product relationship
   */
  async create(params: ProductRelationshipCreateParams): Promise<ProductRelationship> {
    const now = unixTimestamp();

    // Prevent self-relationship
    if (params.productId === params.relatedProductId) {
      throw new Error('Product cannot be related to itself');
    }

    // Check if relationship already exists
    const exists = await this.exists(params.productId, params.relatedProductId, params.type);
    if (exists) {
      throw new Error(`Relationship already exists between products for type '${params.type}'`);
    }

    const result = await queryOne<ProductRelationship>(
      `INSERT INTO "public"."productRelated" (
        "productId", "relatedProductId", "type", "position", "isAutomated",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.productId,
        params.relatedProductId,
        params.type || 'related',
        params.position || 0,
        params.isAutomated || false,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create product relationship');
    }

    return result;
  }

  /**
   * Bulk create relationships
   */
  async createMany(relationships: ProductRelationshipCreateParams[]): Promise<ProductRelationship[]> {
    const created: ProductRelationship[] = [];
    
    for (const relationship of relationships) {
      try {
        const result = await this.create(relationship);
        created.push(result);
      } catch (error) {
        // Skip if already exists or other error, continue with next
        
      }
    }
    
    return created;
  }

  /**
   * Update product relationship
   */
  async update(productRelatedId: string, params: ProductRelationshipUpdateParams): Promise<ProductRelationship | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(productRelatedId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(productRelatedId);

    const result = await queryOne<ProductRelationship>(
      `UPDATE "public"."productRelated" 
       SET ${updateFields.join(', ')}
       WHERE "productRelatedId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Reorder relationship
   */
  async reorder(productRelatedId: string, newPosition: number): Promise<ProductRelationship | null> {
    return this.update(productRelatedId, { position: newPosition });
  }

  /**
   * Bulk reorder relationships
   */
  async bulkReorder(updates: Array<{ productRelatedId: string; position: number }>): Promise<boolean> {
    const now = unixTimestamp();
    
    for (const update of updates) {
      await query(
        `UPDATE "public"."productRelated" 
         SET "position" = $1, "updatedAt" = $2 
         WHERE "productRelatedId" = $3`,
        [update.position, now, update.productRelatedId]
      );
    }
    
    return true;
  }

  /**
   * Delete relationship
   */
  async delete(productRelatedId: string): Promise<boolean> {
    const result = await queryOne<{ productRelatedId: string }>(
      `DELETE FROM "public"."productRelated" WHERE "productRelatedId" = $1 RETURNING "productRelatedId"`,
      [productRelatedId]
    );

    return !!result;
  }

  /**
   * Delete specific relationship
   */
  async deleteRelationship(productId: string, relatedProductId: string, type: RelationType): Promise<boolean> {
    const result = await queryOne<{ productRelatedId: string }>(
      `DELETE FROM "public"."productRelated" 
       WHERE "productId" = $1 AND "relatedProductId" = $2 AND "type" = $3 
       RETURNING "productRelatedId"`,
      [productId, relatedProductId, type]
    );

    return !!result;
  }

  /**
   * Delete all relationships for product
   */
  async deleteAllByProductId(productId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `DELETE FROM "public"."productRelated" WHERE "productId" = $1 RETURNING COUNT(*) as count`,
      [productId]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Delete all automated relationships for product
   */
  async deleteAutomatedByProductId(productId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `DELETE FROM "public"."productRelated" 
       WHERE "productId" = $1 AND "isAutomated" = true 
       RETURNING COUNT(*) as count`,
      [productId]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Create bidirectional relationship
   */
  async createBidirectional(
    productId1: string,
    productId2: string,
    type: RelationType = 'related'
  ): Promise<{ forward: ProductRelationship; reverse: ProductRelationship }> {
    const forward = await this.create({
      productId: productId1,
      relatedProductId: productId2,
      type,
      position: 0,
      isAutomated: false
    });

    const reverse = await this.create({
      productId: productId2,
      relatedProductId: productId1,
      type,
      position: 0,
      isAutomated: false
    });

    return { forward, reverse };
  }

  /**
   * Count relationships by product
   */
  async countByProductId(productId: string, type?: RelationType): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "public"."productRelated" WHERE "productId" = $1`;
    const params: any[] = [productId];
    
    if (type) {
      sql += ` AND "type" = $2`;
      params.push(type);
    }
    
    const result = await queryOne<{ count: string }>(sql, params);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get relationship statistics
   */
  async getStatistics(): Promise<Record<RelationType, number>> {
    const results = await query<{ type: RelationType; count: string }[]>(
      `SELECT "type", COUNT(*) as count FROM "public"."productRelated" GROUP BY "type"`,
      []
    );

    const stats: Record<string, number> = {
      related: 0,
      accessory: 0,
      bundle: 0
    };

    if (results) {
      results.forEach(row => {
        stats[row.type] = parseInt(row.count, 10);
      });
    }

    return stats as Record<RelationType, number>;
  }
}

export default new ProductRelationshipRepo();
