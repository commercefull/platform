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

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  name: 'name',
  code: 'code',
  description: 'description',
  attribute_group_id: 'attributeGroupId',
  type: 'type',
  is_required: 'isRequired',
  is_filterable: 'isFilterable',
  is_searchable: 'isSearchable',
  sort_order: 'sortOrder'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class AttributeRepo {
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

  async findOne(id: string): Promise<Attribute | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<Attribute>(`SELECT ${selectFields} FROM "public"."attribute" WHERE "id" = $1`, [id]);
  }

  async findAll(): Promise<Attribute[]> {
    const selectFields = this.generateSelectFields();
    return await query<Attribute[]>(`SELECT ${selectFields} FROM "public"."attribute" ORDER BY "name" ASC`) || [];
  }

  async findByGroup(groupId: string): Promise<Attribute[]> {
    const selectFields = this.generateSelectFields();
    return await query<Attribute[]>(
      `SELECT ${selectFields} FROM "public"."attribute" WHERE "attribute_group_id" = $1 ORDER BY "sort_order" ASC, "name" ASC`, 
      [groupId]
    ) || [];
  }

  async findByCode(code: string): Promise<Attribute | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<Attribute>(`SELECT ${selectFields} FROM "public"."attribute" WHERE "code" = $1`, [code]);
  }

  async create(attribute: AttributeCreateProps): Promise<Attribute> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const columnMap: Record<string, any> = {
      created_at: now,
      updated_at: now
    };

    for (const [key, value] of Object.entries(attribute)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDb(key);
        columnMap[dbColumn] = value;
      }
    }
    
    const columns = Object.keys(columnMap);
    const values = Object.values(columnMap);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const returnFields = this.generateSelectFields();
    
    const result = await queryOne<Attribute>(
      `INSERT INTO "public"."attribute" (${columns.map(c => `"${c}"`).join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING ${returnFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to create attribute');
    }
    
    return result;
  }

  async update(id: string, attribute: AttributeUpdateProps): Promise<Attribute> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const updateData: Record<string, any> = { updated_at: now };

    for (const [key, value] of Object.entries(attribute)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDb(key);
        updateData[dbColumn] = value;
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      // No updates needed, just return the existing attribute
      const existingAttribute = await this.findOne(id);
      if (!existingAttribute) {
        throw new Error('Attribute not found');
      }
      return existingAttribute;
    }
    
    // Prepare SQL statement
    const setStatements = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`);
    const values = [...Object.values(updateData), id];
    
    const returnFields = this.generateSelectFields();
    
    const result = await queryOne<Attribute>(
      `UPDATE "public"."attribute" 
       SET ${setStatements.join(', ')} 
       WHERE "id" = $${values.length} 
       RETURNING ${returnFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to update attribute');
    }
    
    return result;
  }

  async delete(id: string): Promise<boolean> {
    // Check for references before deleting
    const optionsResult = await query<Array<{count: string}>>(
      `SELECT COUNT(*) as count FROM "public"."attribute_option" WHERE "attribute_id" = $1`,
      [id]
    );
    
    // Check if there are any associated options
    const hasAssociatedOptions = optionsResult && 
                                 optionsResult.length > 0 && 
                                 parseInt(optionsResult[0].count) > 0;
    
    if (hasAssociatedOptions) {
      throw new Error('Cannot delete attribute with associated options');
    }
    
    const result = await query(
      `DELETE FROM "public"."attribute" WHERE "id" = $1`,
      [id]
    );
    
    return result !== null;
  }
}
