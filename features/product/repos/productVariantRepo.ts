import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";

export type ProductVariant = {
  id: string;
  createdAt: Date | number;
  updatedAt: Date | number;
  productId: string;
  sku: string;
  name: string;
  price: number;
  salePrice?: number;
  cost?: number;
  inventory: number;
  inventoryPolicy: InventoryPolicy;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  attributes: Record<string, string | number | boolean>; // e.g., { color: 'red', size: 'M' }
  imageIds?: string[];
  isDefault: boolean;
  isActive: boolean;
  position: number;
  metadata?: Record<string, any>;
  deletedAt?: Date | number;
};

export enum InventoryPolicy {
  DENY = "deny", // Don't allow purchase when out of stock
  CONTINUE = "continue", // Allow purchase when out of stock
  BACKORDER = "backorder" // Allow purchase but mark as backorder
}

export type ProductVariantCreateProps = Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductVariantUpdateProps = Partial<Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt' | 'productId' | 'deletedAt'>>;

export class ProductVariantRepo {
  /**
   * Find a variant by its ID
   */
  async findById(id: string): Promise<ProductVariant | null> {
    return await queryOne<ProductVariant>('SELECT * FROM "public"."productVariant" WHERE "id" = $1 AND "deletedAt" IS NULL', [id]);
  }

  /**
   * Find a variant by its SKU
   */
  async findBySku(sku: string): Promise<ProductVariant | null> {
    return await queryOne<ProductVariant>('SELECT * FROM "public"."productVariant" WHERE "sku" = $1 AND "deletedAt" IS NULL', [sku]);
  }

  /**
   * Get all variants for a product
   */
  async findByProductId(productId: string): Promise<ProductVariant[]> {
    return await query<ProductVariant[]>(
      'SELECT * FROM "public"."productVariant" WHERE "productId" = $1 AND "deletedAt" IS NULL ORDER BY "position" ASC', 
      [productId]
    ) || [];
  }

  /**
   * Create a new variant
   */
  async create(variant: ProductVariantCreateProps): Promise<ProductVariant> {
    const now = new Date();
    const id = generateUUID();
    
    const columns = [
      'id', 'productId', 'sku', 'name', 'price', 'salePrice', 'cost',
      'inventory', 'inventoryPolicy', 'weight', 'dimensions', 'attributes',
      'imageIds', 'isDefault', 'isActive', 'position', 'metadata',
      'createdAt', 'updatedAt'
    ];
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const values = [
      id, 
      variant.productId,
      variant.sku,
      variant.name,
      variant.price,
      variant.salePrice || null,
      variant.cost || null,
      variant.inventory,
      variant.inventoryPolicy,
      variant.weight || null,
      variant.dimensions || null,
      variant.attributes,
      variant.imageIds || null,
      variant.isDefault || false,
      variant.isActive !== undefined ? variant.isActive : true,
      variant.position || 0,
      variant.metadata || null,
      now,
      now
    ];
    
    const sql = `INSERT INTO "public"."productVariant" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await queryOne<ProductVariant>(sql, values);
    if (!result) {
      throw new Error('Failed to create product variant');
    }
    return result;
  }

  /**
   * Update an existing variant
   */
  async update(id: string, variant: ProductVariantUpdateProps): Promise<ProductVariant> {
    const now = new Date();
    
    const updates = Object.entries(variant)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _], index) => `"${key}" = $${index + 1}`);
    
    if (updates.length === 0) {
      const existingVariant = await this.findById(id);
      if (!existingVariant) {
        throw new Error('Variant not found');
      }
      return existingVariant;
    }
    
    updates.push(`"updatedAt" = $${updates.length + 1}`);
    
    const values = [
      ...Object.entries(variant)
        .filter(([_, value]) => value !== undefined)
        .map(([_, value]) => value),
      now,
      id
    ];
    
    const sql = `UPDATE "public"."productVariant" SET ${updates.join(', ')} WHERE "id" = $${values.length} AND "deletedAt" IS NULL RETURNING *`;
    
    const result = await queryOne<ProductVariant>(sql, values);
    if (!result) {
      throw new Error('Failed to update product variant');
    }
    return result;
  }

  /**
   * Update inventory levels
   */
  async updateInventory(id: string, quantity: number): Promise<ProductVariant> {
    const now = new Date();
    
    const sql = `
      UPDATE "public"."productVariant" 
      SET "inventory" = $1, "updatedAt" = $2 
      WHERE "id" = $3 AND "deletedAt" IS NULL 
      RETURNING *
    `;
    
    const result = await queryOne<ProductVariant>(sql, [quantity, now, id]);
    if (!result) {
      throw new Error('Failed to update inventory');
    }
    return result;
  }

  /**
   * Adjust inventory (increment or decrement)
   */
  async adjustInventory(id: string, adjustment: number): Promise<ProductVariant> {
    const now = new Date();
    
    const sql = `
      UPDATE "public"."productVariant" 
      SET "inventory" = "inventory" + $1, "updatedAt" = $2 
      WHERE "id" = $3 AND "deletedAt" IS NULL 
      RETURNING *
    `;
    
    const result = await queryOne<ProductVariant>(sql, [adjustment, now, id]);
    if (!result) {
      throw new Error('Failed to adjust inventory');
    }
    return result;
  }

  /**
   * Soft delete a variant
   */
  async delete(id: string): Promise<boolean> {
    const now = new Date();
    
    const sql = `
      UPDATE "public"."productVariant" 
      SET "deletedAt" = $1, "updatedAt" = $1 
      WHERE "id" = $2 AND "deletedAt" IS NULL
    `;
    
    const result = await query(sql, [now, id]);
    return result !== null;
  }

  /**
   * Set a variant as the default for a product
   */
  async setDefault(id: string): Promise<ProductVariant> {
    const variant = await this.findById(id);
    
    if (!variant) {
      throw new Error('Variant not found');
    }
    
    const now = new Date();
    
    // First, unset default on all variants for this product
    await query(
      `UPDATE "public"."productVariant" SET "isDefault" = false, "updatedAt" = $1 WHERE "productId" = $2 AND "deletedAt" IS NULL`,
      [now, variant.productId]
    );
    
    // Then set this variant as default
    const sql = `
      UPDATE "public"."productVariant" 
      SET "isDefault" = true, "updatedAt" = $1 
      WHERE "id" = $2 AND "deletedAt" IS NULL 
      RETURNING *
    `;
    
    const result = await queryOne<ProductVariant>(sql, [now, id]);
    if (!result) {
      throw new Error('Failed to set default variant');
    }
    return result;
  }

  /**
   * Reorder variants for a product
   */
  async reorder(productId: string, variantIds: string[]): Promise<boolean> {
    const now = new Date();
    
    // Create a transaction for reordering
    const queries = variantIds.map((id, index) => ({
      sql: `UPDATE "public"."productVariant" SET "position" = $1, "updatedAt" = $2 WHERE "id" = $3 AND "productId" = $4 AND "deletedAt" IS NULL`,
      params: [index, now, id, productId]
    }));
    
    // Execute all queries
    for (const q of queries) {
      await query(q.sql, q.params);
    }
    
    return true;
  }
}

export default new ProductVariantRepo();
