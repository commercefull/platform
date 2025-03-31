import { queryOne } from "../../../libs/db"

export type ProductAttribute = {
    id: string,
    createdAt: string,
    updatedAt: string,
    name: string,
    value: string,
    productAttributeCategoryId: string
  }

  export class ProductAttributeRepo {
    async findOne(id: string): Promise<ProductAttribute | null> {
      return await queryOne<ProductAttribute>('SELECT * FROM "public"."product_attribute" WHERE "id" = $1', [id]);
    }   
  }