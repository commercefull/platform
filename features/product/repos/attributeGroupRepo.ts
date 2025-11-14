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

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  name: 'name',
  code: 'code',
  description: 'description',
  sort_order: 'sortOrder'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class AttributeGroupRepo {

  /**
   * Convert camelCase property name to snake_case column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(): string {
    return Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
  }
  
  async findOne(id: string): Promise<AttributeGroup | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<AttributeGroup>(`SELECT ${selectFields} FROM "public"."attribute_group" WHERE "id" = $1`, [id]);
  }

  async findByCode(code: string): Promise<AttributeGroup | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<AttributeGroup>(`SELECT ${selectFields} FROM "public"."attribute_group" WHERE "code" = $1`, [code]);
  }

  async findAll(): Promise<AttributeGroup[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<AttributeGroup[]>(`SELECT ${selectFields} FROM "public"."attribute_group" ORDER BY "sort_order" ASC`);
  }

  async create(props: AttributeGroupCreateProps): Promise<AttributeGroup> {
    const { name, code, description, sortOrder } = props;

    // Convert TS property names to DB column names
    const columnMap = {
      name,
      code,
      description,
      sort_order: sortOrder
    };

    // Generate columns and placeholders for query
    const columns = Object.keys(columnMap)
      .filter(key => columnMap[key as keyof typeof columnMap] !== undefined)
      .map(key => `"${key}"`);

    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Values for the query
    const values = Object.values(columnMap)
      .filter(value => value !== undefined);

    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    const data = await queryOne<AttributeGroup>(
      `INSERT INTO "public"."attribute_group" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING ${returnFields}`,
      values
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
        const dbColumn = this.tsToDb(key);
        updates.push(`"${dbColumn}" = $${paramIndex++}`);
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

    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    const queryString = `UPDATE "public"."attribute_group" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING ${returnFields}`;
    return await queryOne<AttributeGroup>(queryString, values);
  }

  async delete(id: string): Promise<AttributeGroup | null> {
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    return await queryOne<AttributeGroup>(`DELETE FROM "public"."attribute_group" WHERE "id" = $1 RETURNING ${returnFields}`, [id]);
  }
}
