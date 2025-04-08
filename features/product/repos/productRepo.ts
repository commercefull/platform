import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type Product = {
  id: string,
  createdAt: string,
  updatedAt: string,
  name: string,
  description: string,
  productTypeId: string,
  category?: string
}

type ProductCreateProps = Pick<Product, "name" | "description" | "productTypeId">;

type ProductUpdateProps = Partial<Product>;

export class ProductRepo {

  async findOne(id: string): Promise<Product | null> {
    return await queryOne<Product>('SELECT * FROM "public"."product" WHERE "id" = $1', [id]);
  }

  async findById(id: string): Promise<any> {
    return await queryOne<Product>('SELECT * FROM "public"."product" WHERE "id" = $1', [id]);
  }

  async findAll(): Promise<Product[] | null> {
    const value = await query<Product[]>('SELECT * FROM "public"."product"');
    return value;
  }

  async findBySearch(searchTerm: string): Promise<Product[] | null> {
    return await query<Product[]>('SELECT * FROM "public"."product" WHERE "name" ILIKE $1', [`%${searchTerm}%`]);
  }

  async findByCategory(categoryId: string): Promise<Product[] | null> {
    return await query<Product[]>('SELECT * FROM "public"."product" WHERE "categoryId" = $1', [categoryId]);
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM "public"."product"');
    return result ? parseInt(result.count, 10) : 0;
  }

  async countBySearch(searchTerm: string): Promise<number> {
    const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM "public"."product" WHERE "name" ILIKE $1', [`%${searchTerm}%`]);
    return result ? parseInt(result.count, 10) : 0;
  }

  async countByCategory(categoryId: string): Promise<number> {
    const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM "public"."product" WHERE "categoryId" = $1', [categoryId]);
    return result ? parseInt(result.count, 10) : 0;
  }

  async create(props: ProductCreateProps): Promise<Product> {

    const { name, description, productTypeId } = props;

    const data = await queryOne<Product>('INSERT INTO "public"."product" ("name", "description", "productTypeId") VALUES ($1, $2, $3) RETURNING *', [name, description, productTypeId]);

    if (!data) {
      throw new Error('product not saved')
    }

    return data
  }

  async update(id: string, props: ProductUpdateProps) {
    const { name, description, productTypeId } = props;

    return await queryOne<Product>('UPDATE "public"."product" SET "name" = $1, "description" = $2, "productTypeId" = $3, "updatedAt" = $4 WHERE "id" = $5', [name, description, productTypeId, unixTimestamp(), id]);
  }

  async delete(id: string) {
    return await queryOne<Product>('DELETE FROM "public"."product" WHERE "id" = $1', [id]);
  }
  
  // Chain-like methods to support MongoDB-style API (compatibility layer)
  populate(field: string): this {
    // This is a stub for backward compatibility
    return this;
  }
}