import { query, queryOne } from '../../../../libs/db';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';
import type { ProductAttributeToGroup as DbProductAttributeToGroup } from '../../../../libs/db/types';

interface ProductAttributeToGroup {
  productAttributeToGroupId: string;
  createdAt: Date;
  groupId: string;
  attributeId: string;
  position: number;
}

function rowToAttributeToGroup(row: DbProductAttributeToGroup): ProductAttributeToGroup {
  return {
    productAttributeToGroupId: row.productAttributeToGroupId,
    createdAt: row.createdAt,
    groupId: row.groupId,
    attributeId: row.attributeId,
    position: row.position ?? 0,
  };
}

type ProductAttributeToGroupCreateParams = Omit<ProductAttributeToGroup, 'productAttributeToGroupId' | 'createdAt'>;

class ProductAttributeToGroupRepo {
  async findByGroup(attributeGroupId: string): Promise<ProductAttributeToGroup[]> {
    return (
      (await query<DbProductAttributeToGroup[]>(`SELECT * FROM "productAttributeToGroup" WHERE "groupId" = $1 ORDER BY "position" ASC`, [
        attributeGroupId,
      ])) || []
    ).map(rowToAttributeToGroup);
  }

  async create(params: ProductAttributeToGroupCreateParams): Promise<ProductAttributeToGroup> {
    const now = new Date();
    const result = await queryOne<DbProductAttributeToGroup>(
      `INSERT INTO "productAttributeToGroup" ("groupId", "attributeId", "position", "createdAt")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [params.groupId, params.attributeId, params.position ?? 0, now],
    );
    if (!result) throw new FailedToCreateProductError();
    return rowToAttributeToGroup(result);
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
