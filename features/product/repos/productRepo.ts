import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type Product = {
  id: string,
  createdAt: string,
  updatedAt: string,
  name: string,
  description: string,
  productTypeId: string
}

type ProductCreateProps = Pick<Product, "name" | "description" | "productTypeId">;

type ProductUpdateProps = Partial<Product>;

export class ProductRepo {

  async findOne(id: string): Promise<Product | null> {
    return await queryOne<Product>('SELECT * FROM "public"."product" WHERE "id" = $1', [id]);
  }

  async findAll(): Promise<Product[] | null> {

    const value = await query<Product[]>('SELECT * FROM "public"."product"');

    return value
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
}