import { queryOne, query } from '../../../libs/db';
import { Table, ProductAttributeGroup } from '../../../libs/db/types';

// Use ProductAttributeGroup type directly from libs/db/types.ts
export type { ProductAttributeGroup };

type CreateProps = Pick<ProductAttributeGroup, 'name' | 'code' | 'description' | 'position'>;
type UpdateProps = Partial<CreateProps>;

export class AttributeGroupRepo {
  async findOne(id: string): Promise<ProductAttributeGroup | null> {
    return queryOne<ProductAttributeGroup>(`SELECT * FROM "${Table.ProductAttributeGroup}" WHERE "productAttributeGroupId" = $1`, [id]);
  }

  async findByCode(code: string): Promise<ProductAttributeGroup | null> {
    return queryOne<ProductAttributeGroup>(`SELECT * FROM "${Table.ProductAttributeGroup}" WHERE "code" = $1`, [code]);
  }

  async findAll(): Promise<ProductAttributeGroup[]> {
    return (await query<ProductAttributeGroup[]>(`SELECT * FROM "${Table.ProductAttributeGroup}" ORDER BY "position" ASC`)) || [];
  }

  async create(props: CreateProps): Promise<ProductAttributeGroup> {
    const now = new Date();
    const row = await queryOne<ProductAttributeGroup>(
      `INSERT INTO "${Table.ProductAttributeGroup}" 
       ("name", "code", "description", "position", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [props.name, props.code, props.description, props.position, now, now],
    );

    if (!row) {
      throw new Error('Attribute group not saved');
    }
    return row;
  }

  async update(id: string, props: UpdateProps): Promise<ProductAttributeGroup | null> {
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
    return queryOne<ProductAttributeGroup>(
      `UPDATE "${Table.ProductAttributeGroup}" 
       SET ${updates.join(', ')} 
       WHERE "productAttributeGroupId" = $${paramIndex} 
       RETURNING *`,
      values,
    );
  }

  async delete(id: string): Promise<ProductAttributeGroup | null> {
    return queryOne<ProductAttributeGroup>(
      `DELETE FROM "${Table.ProductAttributeGroup}" WHERE "productAttributeGroupId" = $1 RETURNING *`,
      [id],
    );
  }
}
