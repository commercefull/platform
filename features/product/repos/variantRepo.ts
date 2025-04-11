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

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  product_id: 'productId',
  sku: 'sku',
  price: 'price',
  special_price: 'specialPrice',
  special_price_from: 'specialPriceFrom',
  special_price_to: 'specialPriceTo',
  quantity: 'quantity',
  weight: 'weight',
  length: 'length',
  width: 'width',
  height: 'height',
  is_default: 'isDefault',
  status: 'status'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class VariantRepo {
  /**
   * Convert camelCase property name to snake_case column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(): string {
    return Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
  }

  async findOne(id: string): Promise<Variant | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<Variant>(`SELECT ${selectFields} FROM "public"."product_variant" WHERE "id" = $1`, [id]);
  }

  async findBySku(sku: string): Promise<Variant | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<Variant>(`SELECT ${selectFields} FROM "public"."product_variant" WHERE "sku" = $1`, [sku]);
  }

  async findByProduct(productId: string): Promise<Variant[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<Variant[]>(`SELECT ${selectFields} FROM "public"."product_variant" WHERE "product_id" = $1`, [productId]);
  }

  async findDefaultVariant(productId: string): Promise<Variant | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<Variant>(`SELECT ${selectFields} FROM "public"."product_variant" WHERE "product_id" = $1 AND "is_default" = true`, [productId]);
  }

  async findInStock(minQuantity = 1): Promise<Variant[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<Variant[]>(
      `SELECT ${selectFields} FROM "public"."product_variant" WHERE "quantity" >= $1 AND "status" = 'active'`,
      [minQuantity]
    );
  }

  async create(props: VariantCreateProps): Promise<Variant> {
    // Convert camelCase props to snake_case column names
    const snakeCaseProps: Record<string, any> = {};
    Object.entries(props).forEach(([key, value]) => {
      const dbColumn = this.tsToDb(key);
      snakeCaseProps[dbColumn] = value;
    });

    const columns = Object.keys(snakeCaseProps).map(key => `"${key}"`).join(", ");
    const placeholders = Object.keys(snakeCaseProps).map((_, index) => `$${index + 1}`).join(", ");
    const values = Object.values(snakeCaseProps);

    // Generate SELECT fields for returning values in camelCase
    const returnFields = this.generateSelectFields();
    
    const data = await queryOne<Variant>(
      `INSERT INTO "public"."product_variant" (${columns}) VALUES (${placeholders}) RETURNING ${returnFields}`,
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

    // Convert camelCase props to snake_case column names
    const snakeCaseProps: Record<string, any> = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbColumn = this.tsToDb(key);
        snakeCaseProps[dbColumn] = value;
      }
    });

    // Dynamically build the update statement based on provided properties
    Object.entries(snakeCaseProps).forEach(([key, value]) => {
      updates.push(`"${key}" = $${paramIndex++}`);
      values.push(value);
    });

    // Add updatedAt and id
    updates.push(`"updated_at" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(id);

    if (updates.length === 1) {
      return await this.findOne(id); // No fields to update except updatedAt
    }

    // Generate SELECT fields for returning values in camelCase
    const returnFields = this.generateSelectFields();

    const queryStr = `UPDATE "public"."product_variant" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING ${returnFields}`;
    return await queryOne<Variant>(queryStr, values);
  }

  async updateStock(id: string, quantity: number): Promise<Variant | null> {
    const returnFields = this.generateSelectFields();
    return await queryOne<Variant>(
      `UPDATE "public"."product_variant" SET "quantity" = $1, "updated_at" = $2 WHERE "id" = $3 RETURNING ${returnFields}`,
      [quantity, unixTimestamp(), id]
    );
  }

  async delete(id: string): Promise<Variant | null> {
    const returnFields = this.generateSelectFields();
    return await queryOne<Variant>(`DELETE FROM "public"."product_variant" WHERE "id" = $1 RETURNING ${returnFields}`, [id]);
  }
}
