import { queryOne, query } from '../../../libs/db';
import { Table, ProductImage } from '../../../libs/db/types';

// Use ProductImage type directly from libs/db/types.ts
export type { ProductImage };

type CreateProps = Pick<ProductImage, 'productId' | 'url' | 'position' | 'isPrimary' | 'isVisible'> &
  Partial<Pick<ProductImage, 'productVariantId' | 'alt' | 'title' | 'width' | 'height' | 'size' | 'type'>>;
type UpdateProps = Partial<Omit<CreateProps, 'productId'>>;

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
        props.isVisible,
        now,
        now,
      ],
    );

    if (!row) {
      throw new Error('Failed to create product image');
    }

    if (props.isPrimary) {
      await this.updateOtherImagesNonPrimary(row.productImageId, props.productId);
    }

    return row;
  }

  async update(id: string, props: UpdateProps): Promise<ProductImage> {
    const now = new Date();
    const updates: string[] = ['"updatedAt" = $1'];
    const values: any[] = [now];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    values.push(id);
    const row = await queryOne<ProductImage>(
      `UPDATE "${Table.ProductImage}" 
       SET ${updates.join(', ')} 
       WHERE "productImageId" = $${paramIndex} 
       RETURNING *`,
      values,
    );

    if (!row) {
      throw new Error('Failed to update product image');
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
      throw new Error('Image not found');
    }

    const now = new Date();
    await query(`UPDATE "${Table.ProductImage}" SET "isPrimary" = false, "updatedAt" = $1 WHERE "productId" = $2`, [now, image.productId]);

    const row = await queryOne<ProductImage>(
      `UPDATE "${Table.ProductImage}" SET "isPrimary" = true, "updatedAt" = $1 WHERE "productImageId" = $2 RETURNING *`,
      [now, id],
    );

    if (!row) {
      throw new Error('Failed to set primary image');
    }
    return row;
  }

  async reorder(productId: string, imageIds: string[]): Promise<boolean> {
    const now = new Date();
    for (let i = 0; i < imageIds.length; i++) {
      await query(`UPDATE "${Table.ProductImage}" SET "position" = $1, "updatedAt" = $2 WHERE "productImageId" = $3 AND "productId" = $4`, [
        i,
        now,
        imageIds[i],
        productId,
      ]);
    }
    return true;
  }
}

export default new ProductImageRepo();
