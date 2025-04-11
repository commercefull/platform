import { queryOne } from "../../../libs/db"

export type ProductAttribute = {
    id: string,
    createdAt: string,
    updatedAt: string,
    name: string,
    value: string,
    productAttributeCategoryId: string
  }

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  name: 'name',
  value: 'value',
  product_attribute_category_id: 'productAttributeCategoryId'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class ProductAttributeRepo {
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

  async findOne(id: string): Promise<ProductAttribute | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<ProductAttribute>(`SELECT ${selectFields} FROM "public"."product_attribute" WHERE "id" = $1`, [id]);
  }   
}