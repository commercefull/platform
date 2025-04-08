import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type Variant = {
  id: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  sku: string;
  price: number;
  specialPrice: number | null;
  specialPriceFrom: string | null;
  specialPriceTo: string | null;
  quantity: number;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  isDefault: boolean;
  status: 'active' | 'inactive' | 'discontinued';
};

type VariantCreateProps = Omit<Variant, "id" | "createdAt" | "updatedAt">;

type VariantUpdateProps = Partial<VariantCreateProps>;

export class VariantRepo {
  async findOne(id: string): Promise<Variant | null> {
    return await queryOne<Variant>('SELECT * FROM "public"."product_variant" WHERE "id" = $1', [id]);
  }

  async findBySku(sku: string): Promise<Variant | null> {
    return await queryOne<Variant>('SELECT * FROM "public"."product_variant" WHERE "sku" = $1', [sku]);
  }

  async findByProduct(productId: string): Promise<Variant[] | null> {
    return await query<Variant[]>('SELECT * FROM "public"."product_variant" WHERE "productId" = $1', [productId]);
  }

  async findDefaultVariant(productId: string): Promise<Variant | null> {
    return await queryOne<Variant>('SELECT * FROM "public"."product_variant" WHERE "productId" = $1 AND "isDefault" = true', [productId]);
  }

  async findInStock(minQuantity = 1): Promise<Variant[] | null> {
    return await query<Variant[]>(
      'SELECT * FROM "public"."product_variant" WHERE "quantity" >= $1 AND "status" = \'active\'',
      [minQuantity]
    );
  }

  async create(props: VariantCreateProps): Promise<Variant> {
    const columns = Object.keys(props).map(key => `"${key}"`).join(", ");
    const placeholders = Object.keys(props).map((_, index) => `$${index + 1}`).join(", ");
    const values = Object.values(props);

    const data = await queryOne<Variant>(
      `INSERT INTO "public"."product_variant" (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    if (!data) {
      throw new Error('Product variant not saved');
    }

    return data;
  }

  async update(id: string, props: VariantUpdateProps): Promise<Variant | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Dynamically build the update statement based on provided properties
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    // Add updatedAt and id
    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(id);

    if (updates.length === 1) {
      return await this.findOne(id); // No fields to update except updatedAt
    }

    const query = `UPDATE "public"."product_variant" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING *`;
    return await queryOne<Variant>(query, values);
  }

  async updateStock(id: string, quantity: number): Promise<Variant | null> {
    return await queryOne<Variant>(
      'UPDATE "public"."product_variant" SET "quantity" = $1, "updatedAt" = $2 WHERE "id" = $3 RETURNING *',
      [quantity, unixTimestamp(), id]
    );
  }

  async delete(id: string): Promise<Variant | null> {
    return await queryOne<Variant>('DELETE FROM "public"."product_variant" WHERE "id" = $1 RETURNING *', [id]);
  }
}
