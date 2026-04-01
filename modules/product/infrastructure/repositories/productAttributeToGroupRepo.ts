import { query, queryOne } from '../../../../libs/db';

export interface ProductAttributeToGroup {
  productAttributeToGroupId: string;
  createdAt: string;
  attributeGroupId: string;
  attributeId: string;
  position: number;
}

export type ProductAttributeToGroupCreateParams = Omit<ProductAttributeToGroup, 'productAttributeToGroupId' | 'createdAt'>;

export class ProductAttributeToGroupRepo {
  async findByGroup(attributeGroupId: string): Promise<ProductAttributeToGroup[]> {
    return (
      (await query<ProductAttributeToGroup[]>(
        `SELECT * FROM "productAttributeToGroup" WHERE "attributeGroupId" = $1 ORDER BY "position" ASC`,
        [attributeGroupId],
      )) || []
    );
  }

  async create(params: ProductAttributeToGroupCreateParams): Promise<ProductAttributeToGroup> {
    const now = new Date();
    const result = await queryOne<ProductAttributeToGroup>(
      `INSERT INTO "productAttributeToGroup" ("attributeGroupId", "attributeId", "position", "createdAt")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [params.attributeGroupId, params.attributeId, params.position ?? 0, now],
    );
    if (!result) throw new Error('Failed to create productAttributeToGroup');
    return result;
  }

  async delete(productAttributeToGroupId: string): Promise<boolean> {
    const result = await queryOne<{ productAttributeToGroupId: string }>(
      `DELETE FROM "productAttributeToGroup" WHERE "productAttributeToGroupId" = $1 RETURNING "productAttributeToGroupId"`,
      [productAttributeToGroupId],
    );
    return !!result;
  }
}

export default new ProductAttributeToGroupRepo();
