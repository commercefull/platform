import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";

export type ProductImage = {
  id: string;
  productId: string;
  variantId?: string;
  createdAt: Date | number;
  updatedAt: Date | number;
  url: string;
  alt?: string;
  title?: string;
  position: number;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
  isPrimary: boolean;
  isVisible: boolean;
  metadata?: Record<string, any>;
  deletedAt?: Date | number;
};

export type ProductImageCreateProps = Omit<ProductImage, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductImageUpdateProps = Partial<Omit<ProductImage, 'id' | 'productId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  product_id: 'productId',
  variant_id: 'variantId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  url: 'url',
  alt: 'alt',
  title: 'title',
  position: 'position',
  width: 'width',
  height: 'height',
  size: 'size',
  type: 'type',
  is_primary: 'isPrimary',
  is_visible: 'isVisible',
  metadata: 'metadata',
  deleted_at: 'deletedAt'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class ProductImageRepo {
  /**
   * Convert camelCase property name to snake_case column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(fields: string[] = Object.values(dbToTsMapping)): string {
    return fields.map(field => {
      const dbField = this.tsToDb(field);
      return `"${dbField}" AS "${field}"`;
    }).join(', ');
  }

  /**
   * Find an image by its ID
   */
  async findById(id: string): Promise<ProductImage | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<ProductImage>(`SELECT ${selectFields} FROM "public"."product_image" WHERE "id" = $1 AND "deleted_at" IS NULL`, [id]);
  }

  /**
   * Get all images for a product
   */
  async findByProductId(productId: string): Promise<ProductImage[]> {
    const selectFields = this.generateSelectFields();
    return await query<ProductImage[]>(
      `SELECT ${selectFields} FROM "public"."product_image" WHERE "product_id" = $1 AND "deleted_at" IS NULL ORDER BY "position" ASC`, 
      [productId]
    ) || [];
  }

  /**
   * Get all images for a product variant
   */
  async findByVariantId(variantId: string): Promise<ProductImage[]> {
    const selectFields = this.generateSelectFields();
    return await query<ProductImage[]>(
      `SELECT ${selectFields} FROM "public"."product_image" WHERE "variant_id" = $1 AND "deleted_at" IS NULL ORDER BY "position" ASC`, 
      [variantId]
    ) || [];
  }

  /**
   * Get the primary image for a product
   */
  async findPrimaryForProduct(productId: string): Promise<ProductImage | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<ProductImage>(
      `SELECT ${selectFields} FROM "public"."product_image" WHERE "product_id" = $1 AND "is_primary" = true AND "deleted_at" IS NULL`, 
      [productId]
    );
  }

  /**
   * Create a new product image
   */
  async create(image: ProductImageCreateProps): Promise<ProductImage> {
    const now = new Date();
    const id = generateUUID();
    
    // Map TS property names to DB column names
    const columnMap: Record<string, any> = {
      id,
      product_id: image.productId,
      variant_id: image.variantId || null,
      url: image.url,
      alt: image.alt || null,
      title: image.title || null,
      position: image.position || 0,
      width: image.width || null,
      height: image.height || null,
      size: image.size || null,
      type: image.type || null,
      is_primary: image.isPrimary || false,
      is_visible: image.isVisible !== undefined ? image.isVisible : true,
      metadata: image.metadata || {},
      created_at: now,
      updated_at: now
    };
    
    // Filter out undefined values
    const columns = Object.entries(columnMap)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => key);
      
    const values = Object.entries(columnMap)
      .filter(([_, value]) => value !== undefined)
      .map(([_, value]) => value);
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = columns.map(col => 
      `"${col}" AS "${dbToTsMapping[col] || col}"`
    ).join(', ');
    
    const sql = `
      INSERT INTO "public"."product_image" (${columns.map(c => `"${c}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<ProductImage>(sql, values);
    if (!result) {
      throw new Error('Failed to create product image');
    }
    
    // If this is a primary image, update other images to be non-primary
    if (image.isPrimary) {
      await this.updateOtherImagesNonPrimary(id, image.productId);
    }
    
    return result;
  }

  /**
   * Update an existing image
   */
  async update(id: string, image: ProductImageUpdateProps): Promise<ProductImage> {
    const now = new Date();
    
    // Convert property names to DB column names
    const updateData: Record<string, any> = { updated_at: now };
    
    for (const [key, value] of Object.entries(image)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDb(key);
        updateData[dbColumn] = value;
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      const existingImage = await this.findById(id);
      if (!existingImage) {
        throw new Error('Image not found');
      }
      return existingImage;
    }
    
    // Generate set statements for each field
    const setStatements: string[] = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`);
    
    // Create values array with the updated fields
    const values = [
      ...Object.values(updateData),
      id
    ];
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    const sql = `
      UPDATE "public"."product_image" 
      SET ${setStatements.join(', ')} 
      WHERE "id" = $${values.length} AND "deleted_at" IS NULL 
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<ProductImage>(sql, values);
    if (!result) {
      throw new Error('Failed to update product image');
    }
    
    // If this is being set as a primary image, update other images to be non-primary
    if (image.isPrimary === true) {
      await this.updateOtherImagesNonPrimary(id, result.productId);
    }
    
    return result;
  }

  /**
   * Update all other images for a product to be non-primary
   */
  private async updateOtherImagesNonPrimary(currentImageId: string, productId: string): Promise<void> {
    const now = new Date();
    await query(
      `UPDATE "public"."product_image" SET "is_primary" = false, "updated_at" = $1 WHERE "product_id" = $2 AND "id" != $3 AND "deleted_at" IS NULL`,
      [now, productId, currentImageId]
    );
  }

  /**
   * Soft delete an image
   */
  async delete(id: string): Promise<boolean> {
    const now = new Date();
    
    const sql = `
      UPDATE "public"."product_image" 
      SET "deleted_at" = $1, "updated_at" = $1 
      WHERE "id" = $2 AND "deleted_at" IS NULL
    `;
    
    const result = await query(sql, [now, id]);
    
    // Check if this was a primary image
    const image = await this.findById(id);
    if (image && image.isPrimary) {
      // Find another image to make primary
      const otherImages = await this.findByProductId(image.productId);
      if (otherImages.length > 0) {
        await this.update(otherImages[0].id, { isPrimary: true });
      }
    }
    
    return result !== null;
  }

  /**
   * Set an image as the primary one for a product
   */
  async setPrimary(id: string): Promise<ProductImage> {
    const image = await this.findById(id);
    
    if (!image) {
      throw new Error('Image not found');
    }
    
    const now = new Date();
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    // First, unset primary on all images for this product
    await query(
      `UPDATE "public"."product_image" SET "is_primary" = false, "updated_at" = $1 WHERE "product_id" = $2 AND "deleted_at" IS NULL`,
      [now, image.productId]
    );
    
    // Then set this image as primary
    const sql = `
      UPDATE "public"."product_image" 
      SET "is_primary" = true, "updated_at" = $1 
      WHERE "id" = $2 AND "deleted_at" IS NULL 
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<ProductImage>(sql, [now, id]);
    if (!result) {
      throw new Error('Failed to set primary image');
    }
    
    return result;
  }

  /**
   * Reorder images for a product
   */
  async reorder(productId: string, imageIds: string[]): Promise<boolean> {
    const now = new Date();
    
    // Create a transaction for reordering
    const queries = imageIds.map((id, index) => ({
      sql: `UPDATE "public"."product_image" SET "position" = $1, "updated_at" = $2 WHERE "id" = $3 AND "product_id" = $4 AND "deleted_at" IS NULL`,
      params: [index, now, id, productId]
    }));
    
    // Execute all queries
    for (const q of queries) {
      await query(q.sql, q.params);
    }
    
    return true;
  }
}

export default new ProductImageRepo();
