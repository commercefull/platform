import { queryOne, query } from "../../../libs/db";
import { Table, ProductVariant } from "../../../libs/db/types";

// Use ProductVariant type directly from libs/db/types.ts
export type { ProductVariant };

type CreateProps = Omit<ProductVariant, "productVariantId" | "createdAt" | "updatedAt">;
type UpdateProps = Partial<Omit<CreateProps, "productId">>;

export class VariantRepo {
  async findOne(id: string): Promise<ProductVariant | null> {
    return queryOne<ProductVariant>(
      `SELECT * FROM "${Table.ProductVariant}" WHERE "productVariantId" = $1`,
      [id]
    );
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    return queryOne<ProductVariant>(
      `SELECT * FROM "${Table.ProductVariant}" WHERE "sku" = $1`,
      [sku]
    );
  }

  async findByProduct(productId: string): Promise<ProductVariant[]> {
    return await query<ProductVariant[]>(
      `SELECT * FROM "${Table.ProductVariant}" WHERE "productId" = $1`,
      [productId]
    ) || [];
  }

  async findDefaultVariant(productId: string): Promise<ProductVariant | null> {
    return queryOne<ProductVariant>(
      `SELECT * FROM "${Table.ProductVariant}" WHERE "productId" = $1 AND "isDefault" = true`,
      [productId]
    );
  }

  async findInStock(minQuantity = 1): Promise<ProductVariant[]> {
    return await query<ProductVariant[]>(
      `SELECT * FROM "${Table.ProductVariant}" WHERE "status" = 'active'`,
      []
    ) || [];
  }

  async create(props: CreateProps): Promise<ProductVariant> {
    const now = new Date();
    const columns = Object.keys(props).map(k => `"${k}"`).join(", ");
    const placeholders = Object.keys(props).map((_, i) => `$${i + 1}`).join(", ");
    const values = [...Object.values(props), now, now];

    const row = await queryOne<ProductVariant>(
      `INSERT INTO "${Table.ProductVariant}" (${columns}, "createdAt", "updatedAt") 
       VALUES (${placeholders}, $${values.length - 1}, $${values.length}) 
       RETURNING *`,
      values
    );

    if (!row) {
      throw new Error('Product variant not saved');
    }
    return row;
  }

  async update(id: string, props: UpdateProps): Promise<ProductVariant | null> {
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
    return queryOne<ProductVariant>(
      `UPDATE "${Table.ProductVariant}" SET ${updates.join(", ")} WHERE "productVariantId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async delete(id: string): Promise<ProductVariant | null> {
    return queryOne<ProductVariant>(
      `DELETE FROM "${Table.ProductVariant}" WHERE "productVariantId" = $1 RETURNING *`,
      [id]
    );
  }
}
