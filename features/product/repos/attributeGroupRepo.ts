import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type AttributeGroup = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description: string;
  sortOrder: number;
};

type AttributeGroupCreateProps = Pick<AttributeGroup, "name" | "code" | "description" | "sortOrder">;

type AttributeGroupUpdateProps = Partial<AttributeGroupCreateProps>;

export class AttributeGroupRepo {
  async findOne(id: string): Promise<AttributeGroup | null> {
    return await queryOne<AttributeGroup>('SELECT * FROM "public"."attribute_group" WHERE "id" = $1', [id]);
  }

  async findByCode(code: string): Promise<AttributeGroup | null> {
    return await queryOne<AttributeGroup>('SELECT * FROM "public"."attribute_group" WHERE "code" = $1', [code]);
  }

  async findAll(): Promise<AttributeGroup[] | null> {
    return await query<AttributeGroup[]>('SELECT * FROM "public"."attribute_group" ORDER BY "sortOrder" ASC');
  }

  async create(props: AttributeGroupCreateProps): Promise<AttributeGroup> {
    const { name, code, description, sortOrder } = props;

    const data = await queryOne<AttributeGroup>(
      'INSERT INTO "public"."attribute_group" ("name", "code", "description", "sortOrder") VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, description, sortOrder]
    );

    if (!data) {
      throw new Error('Attribute group not saved');
    }

    return data;
  }

  async update(id: string, props: AttributeGroupUpdateProps): Promise<AttributeGroup | null> {
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

    const query = `UPDATE "public"."attribute_group" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING *`;
    return await queryOne<AttributeGroup>(query, values);
  }

  async delete(id: string): Promise<AttributeGroup | null> {
    return await queryOne<AttributeGroup>('DELETE FROM "public"."attribute_group" WHERE "id" = $1 RETURNING *', [id]);
  }
}
