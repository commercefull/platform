import { queryOne, query } from '../../../libs/db';
import { Table, ProductAttribute } from '../../../libs/db/types';

// Use ProductAttribute type directly from libs/db/types.ts
export type { ProductAttribute };

// Create/Update props use the entity type directly
type AttributeCreateProps = Pick<
  ProductAttribute,
  'name' | 'code' | 'description' | 'groupId' | 'type' | 'isRequired' | 'isFilterable' | 'isSearchable' | 'position'
>;

type AttributeUpdateProps = Partial<AttributeCreateProps>;

export class AttributeRepo {
  async findOne(id: string): Promise<ProductAttribute | null> {
    return queryOne<ProductAttribute>(`SELECT * FROM "${Table.ProductAttribute}" WHERE "productAttributeId" = $1`, [id]);
  }

  async findAll(): Promise<ProductAttribute[]> {
    return (await query<ProductAttribute[]>(`SELECT * FROM "${Table.ProductAttribute}" ORDER BY "name" ASC`)) || [];
  }

  async findByGroup(groupId: string): Promise<ProductAttribute[]> {
    return (
      (await query<ProductAttribute[]>(
        `SELECT * FROM "${Table.ProductAttribute}" WHERE "groupId" = $1 ORDER BY "position" ASC, "name" ASC`,
        [groupId],
      )) || []
    );
  }

  async findByCode(code: string): Promise<ProductAttribute | null> {
    return queryOne<ProductAttribute>(`SELECT * FROM "${Table.ProductAttribute}" WHERE "code" = $1`, [code]);
  }

  async create(attribute: AttributeCreateProps): Promise<ProductAttribute> {
    const now = new Date();

    const row = await queryOne<ProductAttribute>(
      `INSERT INTO "${Table.ProductAttribute}" 
       ("name", "code", "description", "groupId", "type", "isRequired", "isFilterable", "isSearchable", "position", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        attribute.name,
        attribute.code,
        attribute.description,
        attribute.groupId,
        attribute.type,
        attribute.isRequired,
        attribute.isFilterable,
        attribute.isSearchable,
        attribute.position,
        now,
        now,
      ],
    );

    if (!row) {
      throw new Error('Failed to create attribute');
    }

    return row;
  }

  async update(id: string, attribute: AttributeUpdateProps): Promise<ProductAttribute> {
    const now = new Date();

    // Build dynamic update
    const updates: string[] = ['"updatedAt" = $1'];
    const values: any[] = [now];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(attribute)) {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    values.push(id);

    const row = await queryOne<ProductAttribute>(
      `UPDATE "${Table.ProductAttribute}" 
       SET ${updates.join(', ')} 
       WHERE "productAttributeId" = $${paramIndex} 
       RETURNING *`,
      values,
    );

    if (!row) {
      throw new Error('Failed to update attribute');
    }

    return row;
  }

  async delete(id: string): Promise<boolean> {
    // Check for references before deleting
    const optionsResult = await query<Array<{ count: string }>>(
      `SELECT COUNT(*) as count FROM "${Table.ProductAttributeOption}" WHERE "attributeId" = $1`,
      [id],
    );

    // Check if there are any associated options
    const hasAssociatedOptions = optionsResult && optionsResult.length > 0 && parseInt(optionsResult[0].count) > 0;

    if (hasAssociatedOptions) {
      throw new Error('Cannot delete attribute with associated options');
    }

    const result = await query(`DELETE FROM "${Table.ProductAttribute}" WHERE "productAttributeId" = $1`, [id]);

    return result !== null;
  }
}
