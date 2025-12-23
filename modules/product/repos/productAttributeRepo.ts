import { queryOne, query } from '../../../libs/db';
import { Table, ProductAttributeValue } from '../../../libs/db/types';

// Use ProductAttributeValue type directly from libs/db/types.ts
export type { ProductAttributeValue };

export class ProductAttributeRepo {
  async findOne(id: string): Promise<ProductAttributeValue | null> {
    return queryOne<ProductAttributeValue>(`SELECT * FROM "${Table.ProductAttributeValue}" WHERE "productAttributeValueId" = $1`, [id]);
  }

  async findByAttribute(attributeId: string): Promise<ProductAttributeValue[]> {
    return (
      (await query<ProductAttributeValue[]>(
        `SELECT * FROM "${Table.ProductAttributeValue}" WHERE "attributeId" = $1 ORDER BY "position" ASC`,
        [attributeId],
      )) || []
    );
  }
}
