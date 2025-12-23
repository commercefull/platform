import { queryOne, query } from '../../../libs/db';
import { Table, ProductAttributeOption } from '../../../libs/db/types';

// Use ProductAttributeOption type directly from libs/db/types.ts
export type { ProductAttributeOption };

type CreateProps = Pick<ProductAttributeOption, 'attributeId' | 'value' | 'label' | 'position'>;
type UpdateProps = Partial<CreateProps>;

export class AttributeOptionRepo {
  async findOne(id: string): Promise<ProductAttributeOption | null> {
    return queryOne<ProductAttributeOption>(`SELECT * FROM "${Table.ProductAttributeOption}" WHERE "productAttributeOptionId" = $1`, [id]);
  }

  async findByValue(attributeId: string, value: string): Promise<ProductAttributeOption | null> {
    return queryOne<ProductAttributeOption>(`SELECT * FROM "${Table.ProductAttributeOption}" WHERE "attributeId" = $1 AND "value" = $2`, [
      attributeId,
      value,
    ]);
  }

  async findByAttribute(attributeId: string): Promise<ProductAttributeOption[]> {
    return (
      (await query<ProductAttributeOption[]>(
        `SELECT * FROM "${Table.ProductAttributeOption}" WHERE "attributeId" = $1 ORDER BY "position" ASC`,
        [attributeId],
      )) || []
    );
  }

  async create(props: CreateProps): Promise<ProductAttributeOption> {
    const now = new Date();
    const row = await queryOne<ProductAttributeOption>(
      `INSERT INTO "${Table.ProductAttributeOption}" 
       ("attributeId", "value", "label", "position", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [props.attributeId, props.value, props.label, props.position, now, now],
    );

    if (!row) {
      throw new Error('Attribute option not saved');
    }
    return row;
  }

  async bulkCreate(options: CreateProps[]): Promise<ProductAttributeOption[]> {
    if (options.length === 0) return [];

    const now = new Date();
    const valueGroups = options.map((_, i) => {
      const offset = i * 6;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    });

    const values = options.flatMap(opt => [opt.attributeId, opt.value, opt.label, opt.position, now, now]);

    return (
      (await query<ProductAttributeOption[]>(
        `INSERT INTO "${Table.ProductAttributeOption}" 
       ("attributeId", "value", "label", "position", "createdAt", "updatedAt") 
       VALUES ${valueGroups.join(', ')} 
       RETURNING *`,
        values,
      )) || []
    );
  }

  async update(id: string, props: UpdateProps): Promise<ProductAttributeOption | null> {
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
    return queryOne<ProductAttributeOption>(
      `UPDATE "${Table.ProductAttributeOption}" 
       SET ${updates.join(', ')} 
       WHERE "productAttributeOptionId" = $${paramIndex} 
       RETURNING *`,
      values,
    );
  }

  async delete(id: string): Promise<ProductAttributeOption | null> {
    return queryOne<ProductAttributeOption>(
      `DELETE FROM "${Table.ProductAttributeOption}" WHERE "productAttributeOptionId" = $1 RETURNING *`,
      [id],
    );
  }

  async deleteByAttribute(attributeId: string): Promise<number> {
    const result = await query<any>(`DELETE FROM "${Table.ProductAttributeOption}" WHERE "attributeId" = $1`, [attributeId]);
    return result?.rowCount || 0;
  }
}
