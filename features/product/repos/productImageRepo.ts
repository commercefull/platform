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

export class ProductImageRepo {
  /**
   * Find an image by its ID
   */
  async findById(id: string): Promise<ProductImage | null> {
    return await queryOne<ProductImage>('SELECT * FROM "public"."productImage" WHERE "id" = $1 AND "deletedAt" IS NULL', [id]);
  }

  /**
   * Get all images for a product
   */
  async findByProductId(productId: string): Promise<ProductImage[]> {
    return await query<ProductImage[]>(
      'SELECT * FROM "public"."productImage" WHERE "productId" = $1 AND "deletedAt" IS NULL ORDER BY "position" ASC', 
      [productId]
    ) || [];
  }

  /**
   * Get all images for a product variant
   */
  async findByVariantId(variantId: string): Promise<ProductImage[]> {
    return await query<ProductImage[]>(
      'SELECT * FROM "public"."productImage" WHERE "variantId" = $1 AND "deletedAt" IS NULL ORDER BY "position" ASC', 
      [variantId]
    ) || [];
  }

  /**
   * Get the primary image for a product
   */
  async findPrimaryForProduct(productId: string): Promise<ProductImage | null> {
    return await queryOne<ProductImage>(
      'SELECT * FROM "public"."productImage" WHERE "productId" = $1 AND "isPrimary" = true AND "deletedAt" IS NULL', 
      [productId]
    );
  }

  /**
   * Create a new product image
   */
  async create(image: ProductImageCreateProps): Promise<ProductImage> {
    const now = new Date();
    const id = generateUUID();
    
    const columns = [
      'id', 'productId', 'variantId', 'url', 'alt', 'title',
      'position', 'width', 'height', 'size', 'type',
      'isPrimary', 'isVisible', 'metadata', 'createdAt', 'updatedAt'
    ];
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const values = [
      id, 
      image.productId,
      image.variantId || null,
      image.url,
      image.alt || null,
      image.title || null,
      image.position || 0,
      image.width || null,
      image.height || null,
      image.size || null,
      image.type || null,
      image.isPrimary || false,
      image.isVisible !== undefined ? image.isVisible : true,
      image.metadata || {},
      now,
      now
    ];
    
    const sql = `INSERT INTO "public"."productImage" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
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
    
    const updates = Object.entries(image)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _], index) => `"${key}" = $${index + 1}`);
    
    if (updates.length === 0) {
      const existingImage = await this.findById(id);
      if (!existingImage) {
        throw new Error('Image not found');
      }
      return existingImage;
    }
    
    updates.push(`"updatedAt" = $${updates.length + 1}`);
    
    const values = [
      ...Object.entries(image)
        .filter(([_, value]) => value !== undefined)
        .map(([_, value]) => value),
      now,
      id
    ];
    
    const sql = `UPDATE "public"."productImage" SET ${updates.join(', ')} WHERE "id" = $${values.length} AND "deletedAt" IS NULL RETURNING *`;
    
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
      `UPDATE "public"."productImage" SET "isPrimary" = false, "updatedAt" = $1 WHERE "productId" = $2 AND "id" != $3 AND "deletedAt" IS NULL`,
      [now, productId, currentImageId]
    );
  }

  /**
   * Soft delete an image
   */
  async delete(id: string): Promise<boolean> {
    const now = new Date();
    
    const sql = `
      UPDATE "public"."productImage" 
      SET "deletedAt" = $1, "updatedAt" = $1 
      WHERE "id" = $2 AND "deletedAt" IS NULL
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
    
    // First, unset primary on all images for this product
    await query(
      `UPDATE "public"."productImage" SET "isPrimary" = false, "updatedAt" = $1 WHERE "productId" = $2 AND "deletedAt" IS NULL`,
      [now, image.productId]
    );
    
    // Then set this image as primary
    const sql = `
      UPDATE "public"."productImage" 
      SET "isPrimary" = true, "updatedAt" = $1 
      WHERE "id" = $2 AND "deletedAt" IS NULL 
      RETURNING *
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
      sql: `UPDATE "public"."productImage" SET "position" = $1, "updatedAt" = $2 WHERE "id" = $3 AND "productId" = $4 AND "deletedAt" IS NULL`,
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
