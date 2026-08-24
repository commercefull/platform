import { queryOne, query } from '../../../../libs/db';
import { Table, ProductImage } from '../../../../libs/db/types';
import { ProductImageNotFoundError, ProductValidationError, FailedToCreateProductError } from '../../domain/errors/ProductErrors';

// Use ProductImage type directly from libs/db/types.ts
export type { ProductImage };

type CreateProps = Pick<ProductImage, 'productId' | 'url' | 'position' | 'isPrimary'> &
  Partial<Pick<ProductImage, 'productVariantId' | 'alt' | 'title' | 'width' | 'height' | 'size' | 'type' | 'isVisible'>>;

// Accept both API names (altText) and DB names (alt) in updates
type UpdateProps = Partial<Omit<CreateProps, 'productId'>> & { altText?: string };

// Map API field names to DB column names
const FIELD_MAP: Record<string, string> = {
  altText: 'alt',
};

export class ProductImageRepo {
  async findById(id: string): Promise<ProductImage | null> {
    return queryOne<ProductImage>(`SELECT * FROM "${Table.ProductImage}" WHERE "productImageId" = $1`, [id]);
  }

  async findByProductId(productId: string): Promise<ProductImage[]> {
    return (
      (await query<ProductImage[]>(`SELECT * FROM "${Table.ProductImage}" WHERE "productId" = $1 ORDER BY "position" ASC`, [productId])) ||
      []
    );
  }

  async findByVariantId(variantId: string): Promise<ProductImage[]> {
    return (
      (await query<ProductImage[]>(`SELECT * FROM "${Table.ProductImage}" WHERE "productVariantId" = $1 ORDER BY "position" ASC`, [
        variantId,
      ])) || []
    );
  }

  async findPrimaryForProduct(productId: string): Promise<ProductImage | null> {
    return queryOne<ProductImage>(`SELECT * FROM "${Table.ProductImage}" WHERE "productId" = $1 AND "isPrimary" = true`, [productId]);
  }

  async create(props: CreateProps): Promise<ProductImage> {
    const now = new Date();
    const row = await queryOne<ProductImage>(
      `INSERT INTO "${Table.ProductImage}" 
       ("productId", "productVariantId", "url", "alt", "title", "position", "width", "height", "size", "type", "isPrimary", "isVisible", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        props.productId,
        props.productVariantId || null,
        props.url,
        props.alt || null,
        props.title || null,
        props.position,
        props.width || null,
        props.height || null,
        props.size || null,
        props.type || null,
        props.isPrimary,
        props.isVisible ?? true,
        now,
        now,
      ],
    );

    if (!row) {
      throw new FailedToCreateProductError();
    }

    if (props.isPrimary) {
      await this.updateOtherImagesNonPrimary(row.productImageId, props.productId);
    }

    return row;
  }

  async update(id: string, props: UpdateProps): Promise<ProductImage> {
    const now = new Date();
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        const dbCol = FIELD_MAP[key] ?? key;
        setClauses.push(`"${dbCol}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    // Always update updatedAt
    setClauses.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);

    // WHERE clause
    values.push(id);

    const row = await queryOne<ProductImage>(
      `UPDATE "${Table.ProductImage}" 
       SET ${setClauses.join(', ')} 
       WHERE "productImageId" = $${paramIndex} 
       RETURNING *`,
      values,
    );

    if (!row) {
      throw new ProductValidationError('Failed to update product image');
    }

    if (props.isPrimary === true) {
      await this.updateOtherImagesNonPrimary(id, row.productId);
    }

    return row;
  }

  private async updateOtherImagesNonPrimary(currentImageId: string, productId: string): Promise<void> {
    const now = new Date();
    await query(
      `UPDATE "${Table.ProductImage}" SET "isPrimary" = false, "updatedAt" = $1 WHERE "productId" = $2 AND "productImageId" != $3`,
      [now, productId, currentImageId],
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM "${Table.ProductImage}" WHERE "productImageId" = $1`, [id]);
    return result !== null;
  }

  async setPrimary(id: string): Promise<ProductImage> {
    const image = await this.findById(id);
    if (!image) {
      throw new ProductImageNotFoundError(id);
    }

    const now = new Date();
    await query(`UPDATE "${Table.ProductImage}" SET "isPrimary" = false, "updatedAt" = $1 WHERE "productId" = $2`, [now, image.productId]);

    const row = await queryOne<ProductImage>(
      `UPDATE "${Table.ProductImage}" SET "isPrimary" = true, "updatedAt" = $1 WHERE "productImageId" = $2 RETURNING *`,
      [now, id],
    );

    if (!row) {
      throw new ProductValidationError('Failed to set primary image');
    }
    return row;
  }

  async reorder(productId: string, imageIds: string[]): Promise<boolean> {
    const now = new Date();
    for (let i = 0; i < imageIds.length; i++) {
      await query(
        `UPDATE "${Table.ProductImage}" SET "position" = $1, "updatedAt" = $2 WHERE "productImageId" = $3 AND "productId" = $4`,
        [i, now, imageIds[i], productId],
      );
    }
    return true;
  }
}

export default new ProductImageRepo();
