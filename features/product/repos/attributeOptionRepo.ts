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

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  attribute_id: 'attributeId',
  value: 'value',
  label: 'label',
  sort_order: 'sortOrder'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class AttributeOptionRepo {
  /**
   * Convert snake_case column name to camelCase property name
   */
  private dbToTs(columnName: string): string {
    return dbToTsMapping[columnName] || columnName;
  }

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
  
  async findOne(id: string): Promise<AttributeOption | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<AttributeOption>(`SELECT ${selectFields} FROM "public"."attribute_option" WHERE "id" = $1`, [id]);
  }

  async findByValue(attributeId: string, value: string): Promise<AttributeOption | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<AttributeOption>(
      `SELECT ${selectFields} FROM "public"."attribute_option" WHERE "attribute_id" = $1 AND "value" = $2`,
      [attributeId, value]
    );
  }

  async findByAttribute(attributeId: string): Promise<AttributeOption[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<AttributeOption[]>(
      `SELECT ${selectFields} FROM "public"."attribute_option" WHERE "attribute_id" = $1 ORDER BY "sort_order" ASC`,
      [attributeId]
    );
  }

  async create(props: AttributeOptionCreateProps): Promise<AttributeOption> {
    const { attributeId, value, label, sortOrder } = props;

    // Convert TS property names to DB column names
    const columnMap = {
      attribute_id: attributeId,
      value,
      label,
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

    const data = await queryOne<AttributeOption>(
      `INSERT INTO "public"."attribute_option" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING ${returnFields}`,
      values
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

    // Map the column names to their snake_case DB equivalents
    const dbColumns = [
      this.tsToDb('attributeId'),
      this.tsToDb('value'),
      this.tsToDb('label'),
      this.tsToDb('sortOrder')
    ];

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

    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    return await query<AttributeOption[]>(
      `INSERT INTO "public"."attribute_option" (${dbColumns.map(col => `"${col}"`).join(', ')}) VALUES ${valueGroups.join(', ')} RETURNING ${returnFields}`,
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
        const dbColumn = this.tsToDb(key);
        updates.push(`"${dbColumn}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    // Add updatedAt and id
    updates.push(`"updated_at" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(id);

    if (updates.length === 1) {
      return await this.findOne(id); // No fields to update except updatedAt
    }

    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    const queryString = `UPDATE "public"."attribute_option" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING ${returnFields}`;
    return await queryOne<AttributeOption>(queryString, values);
  }

  async delete(id: string): Promise<AttributeOption | null> {
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    return await queryOne<AttributeOption>(`DELETE FROM "public"."attribute_option" WHERE "id" = $1 RETURNING ${returnFields}`, [id]);
  }

  async deleteByAttribute(attributeId: string): Promise<number> {
    const result = await query<any>(
      'DELETE FROM "public"."attribute_option" WHERE "attribute_id" = $1',
      [attributeId]
    );
    return result?.rowCount || 0;
  }
}
