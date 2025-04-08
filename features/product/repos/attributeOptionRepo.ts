import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type AttributeOption = {
  id: string;
  createdAt: string;
  updatedAt: string;
  attributeId: string;
  value: string;
  label: string;
  sortOrder: number;
};

type AttributeOptionCreateProps = Pick<AttributeOption, "attributeId" | "value" | "label" | "sortOrder">;

type AttributeOptionUpdateProps = Partial<AttributeOptionCreateProps>;

export class AttributeOptionRepo {
  async findOne(id: string): Promise<AttributeOption | null> {
    return await queryOne<AttributeOption>('SELECT * FROM "public"."attribute_option" WHERE "id" = $1', [id]);
  }

  async findByValue(attributeId: string, value: string): Promise<AttributeOption | null> {
    return await queryOne<AttributeOption>(
      'SELECT * FROM "public"."attribute_option" WHERE "attributeId" = $1 AND "value" = $2',
      [attributeId, value]
    );
  }

  async findByAttribute(attributeId: string): Promise<AttributeOption[] | null> {
    return await query<AttributeOption[]>(
      'SELECT * FROM "public"."attribute_option" WHERE "attributeId" = $1 ORDER BY "sortOrder" ASC',
      [attributeId]
    );
  }

  async create(props: AttributeOptionCreateProps): Promise<AttributeOption> {
    const { attributeId, value, label, sortOrder } = props;

    const data = await queryOne<AttributeOption>(
      'INSERT INTO "public"."attribute_option" ("attributeId", "value", "label", "sortOrder") VALUES ($1, $2, $3, $4) RETURNING *',
      [attributeId, value, label, sortOrder]
    );

    if (!data) {
      throw new Error('Attribute option not saved');
    }

    return data;
  }

  async bulkCreate(options: AttributeOptionCreateProps[]): Promise<AttributeOption[] | null> {
    if (options.length === 0) {
      return [];
    }

    const valueGroups = options.map((option, i) => {
      const offset = i * 4;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    });

    const values = options.flatMap(option => [
      option.attributeId,
      option.value,
      option.label,
      option.sortOrder
    ]);

    return await query<AttributeOption[]>(
      `INSERT INTO "public"."attribute_option" ("attributeId", "value", "label", "sortOrder") VALUES ${valueGroups.join(', ')} RETURNING *`,
      values
    );
  }

  async update(id: string, props: AttributeOptionUpdateProps): Promise<AttributeOption | null> {
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

    const query = `UPDATE "public"."attribute_option" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING *`;
    return await queryOne<AttributeOption>(query, values);
  }

  async delete(id: string): Promise<AttributeOption | null> {
    return await queryOne<AttributeOption>('DELETE FROM "public"."attribute_option" WHERE "id" = $1 RETURNING *', [id]);
  }

  async deleteByAttribute(attributeId: string): Promise<number> {
    const result = await query<any>(
      'DELETE FROM "public"."attribute_option" WHERE "attributeId" = $1',
      [attributeId]
    );
    return result?.rowCount || 0;
  }
}
