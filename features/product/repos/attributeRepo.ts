import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type Attribute = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description: string;
  attributeGroupId: string;
  type: string; // text, number, boolean, select, multiselect, date, etc.
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  sortOrder: number;
};

type AttributeCreateProps = Pick<
  Attribute, 
  "name" | "code" | "description" | "attributeGroupId" | "type" | "isRequired" | "isFilterable" | "isSearchable" | "sortOrder"
>;

type AttributeUpdateProps = Partial<AttributeCreateProps>;

export class AttributeRepo {
  async findOne(id: string): Promise<Attribute | null> {
    return await queryOne<Attribute>('SELECT * FROM "public"."attribute" WHERE "id" = $1', [id]);
  }

  async findByCode(code: string): Promise<Attribute | null> {
    return await queryOne<Attribute>('SELECT * FROM "public"."attribute" WHERE "code" = $1', [code]);
  }

  async findAll(): Promise<Attribute[] | null> {
    return await query<Attribute[]>('SELECT * FROM "public"."attribute" ORDER BY "sortOrder" ASC');
  }

  async findByGroup(groupId: string): Promise<Attribute[] | null> {
    return await query<Attribute[]>(
      'SELECT * FROM "public"."attribute" WHERE "attributeGroupId" = $1 ORDER BY "sortOrder" ASC', 
      [groupId]
    );
  }

  async findFilterable(): Promise<Attribute[] | null> {
    return await query<Attribute[]>(
      'SELECT * FROM "public"."attribute" WHERE "isFilterable" = true ORDER BY "sortOrder" ASC'
    );
  }

  async findSearchable(): Promise<Attribute[] | null> {
    return await query<Attribute[]>(
      'SELECT * FROM "public"."attribute" WHERE "isSearchable" = true ORDER BY "sortOrder" ASC'
    );
  }

  async create(props: AttributeCreateProps): Promise<Attribute> {
    const { 
      name, code, description, attributeGroupId, 
      type, isRequired, isFilterable, isSearchable, sortOrder 
    } = props;

    const data = await queryOne<Attribute>(
      'INSERT INTO "public"."attribute" ("name", "code", "description", "attributeGroupId", "type", "isRequired", "isFilterable", "isSearchable", "sortOrder") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, code, description, attributeGroupId, type, isRequired, isFilterable, isSearchable, sortOrder]
    );

    if (!data) {
      throw new Error('Attribute not saved');
    }

    return data;
  }

  async update(id: string, props: AttributeUpdateProps): Promise<Attribute | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Dynamically build the update statement based on provided properties
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    // Add updatedAt and id
    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(id);

    if (updates.length === 1) {
      return await this.findOne(id); // No fields to update except updatedAt
    }

    const query = `UPDATE "public"."attribute" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING *`;
    return await queryOne<Attribute>(query, values);
  }

  async delete(id: string): Promise<Attribute | null> {
    return await queryOne<Attribute>('DELETE FROM "public"."attribute" WHERE "id" = $1 RETURNING *', [id]);
  }
}
