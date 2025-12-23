import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';

/**
 * Product Attribute - defines an attribute that can be assigned to products
 */
export interface ProductAttribute {
  productAttributeId: string;
  name: string;
  code: string;
  description?: string;
  groupId?: string;
  type: AttributeType;
  inputType: AttributeInputType;
  isRequired: boolean;
  isUnique: boolean;
  isSystem: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  isVisibleOnFront: boolean;
  isUsedInProductListing: boolean;
  useForVariants: boolean;
  useForConfigurations: boolean;
  position: number;
  defaultValue?: string;
  validationRules?: Record<string, any>;
  options?: Record<string, any>;
  merchantId?: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AttributeType =
  | 'text'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'image'
  | 'video'
  | 'document';

export type AttributeInputType = AttributeType;

/**
 * Attribute Value - predefined values for select/radio/checkbox attributes
 */
export interface ProductAttributeValue {
  productAttributeValueId: string;
  attributeId: string;
  value: string;
  displayValue?: string;
  position: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Attribute Data - actual attribute values assigned to a product
 * Maps to productAttributeValueMap table
 */
export interface ProductAttributeData {
  productAttributeValueMapId: string;
  productId: string;
  productVariantId?: string;
  attributeId: string;
  value?: string;
  valueText?: string;
  valueNumeric?: number;
  valueBoolean?: boolean;
  valueJson?: Record<string, any>;
  valueDate?: Date;
  isSystem: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributeCreateInput {
  name: string;
  code: string;
  description?: string;
  groupId?: string;
  type?: AttributeType;
  inputType?: AttributeInputType;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  isVisibleOnFront?: boolean;
  isUsedInProductListing?: boolean;
  useForVariants?: boolean;
  useForConfigurations?: boolean;
  position?: number;
  defaultValue?: string;
  validationRules?: Record<string, any>;
  options?: Record<string, any>;
  merchantId?: string;
  isGlobal?: boolean;
}

export interface ProductAttributeUpdateInput extends Partial<ProductAttributeCreateInput> {}

export interface AttributeValueCreateInput {
  attributeId: string;
  value: string;
  displayValue?: string;
  position?: number;
  isDefault?: boolean;
}

export interface SetProductAttributeInput {
  productId: string;
  attributeId: string;
  value: string;
  productVariantId?: string;
}

export class DynamicAttributeRepository {
  private readonly attributeTable = Table.ProductAttribute;
  private readonly attributeValueTable = Table.ProductAttributeValue;
  private readonly attributeValueMapTable = Table.ProductAttributeValueMap;
  private readonly attributeGroupTable = Table.ProductAttributeGroup;

  // ==================== ATTRIBUTE METHODS ====================

  async findAttributeById(id: string): Promise<ProductAttribute | null> {
    const sql = `SELECT * FROM "${this.attributeTable}" WHERE "productAttributeId" = $1`;
    return await queryOne<ProductAttribute>(sql, [id]);
  }

  async findAttributeByCode(code: string): Promise<ProductAttribute | null> {
    const sql = `SELECT * FROM "${this.attributeTable}" WHERE "code" = $1`;
    return await queryOne<ProductAttribute>(sql, [code]);
  }

  async findAllAttributes(): Promise<ProductAttribute[]> {
    const sql = `SELECT * FROM "${this.attributeTable}" ORDER BY "position" ASC, "name" ASC`;
    return (await query<ProductAttribute[]>(sql)) || [];
  }

  async findAttributesByGroup(groupId: string): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "groupId" = $1 
      ORDER BY "position" ASC, "name" ASC
    `;
    return (await query<ProductAttribute[]>(sql, [groupId])) || [];
  }

  async findSearchableAttributes(): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "isSearchable" = true 
      ORDER BY "position" ASC
    `;
    return (await query<ProductAttribute[]>(sql)) || [];
  }

  async findFilterableAttributes(): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "isFilterable" = true 
      ORDER BY "position" ASC
    `;
    return (await query<ProductAttribute[]>(sql)) || [];
  }

  async findVariantAttributes(): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "useForVariants" = true 
      ORDER BY "position" ASC
    `;
    return (await query<ProductAttribute[]>(sql)) || [];
  }

  async createAttribute(input: ProductAttributeCreateInput): Promise<ProductAttribute> {
    const sql = `
      INSERT INTO "${this.attributeTable}" (
        "name", "code", "description", "groupId", "type", "inputType",
        "isRequired", "isUnique", "isSearchable", "isFilterable", "isComparable",
        "isVisibleOnFront", "isUsedInProductListing", "useForVariants", "useForConfigurations",
        "position", "defaultValue", "validationRules", "options", "merchantId", "isGlobal"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const result = await queryOne<ProductAttribute>(sql, [
      input.name,
      input.code,
      input.description || null,
      input.groupId || null,
      input.type || 'text',
      input.inputType || input.type || 'text',
      input.isRequired || false,
      input.isUnique || false,
      input.isSearchable !== false,
      input.isFilterable !== false,
      input.isComparable !== false,
      input.isVisibleOnFront !== false,
      input.isUsedInProductListing || false,
      input.useForVariants || false,
      input.useForConfigurations || false,
      input.position || 0,
      input.defaultValue || null,
      input.validationRules ? JSON.stringify(input.validationRules) : null,
      input.options ? JSON.stringify(input.options) : null,
      input.merchantId || null,
      input.isGlobal !== false,
    ]);

    if (!result) {
      throw new Error('Failed to create attribute');
    }

    return result;
  }

  async updateAttribute(id: string, input: ProductAttributeUpdateInput): Promise<ProductAttribute | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
    let paramIndex = 2;

    const fields: (keyof ProductAttributeUpdateInput)[] = [
      'name',
      'code',
      'description',
      'groupId',
      'type',
      'inputType',
      'isRequired',
      'isUnique',
      'isSearchable',
      'isFilterable',
      'isComparable',
      'isVisibleOnFront',
      'isUsedInProductListing',
      'useForVariants',
      'useForConfigurations',
      'position',
      'defaultValue',
      'validationRules',
      'options',
    ];

    for (const field of fields) {
      if (input[field] !== undefined) {
        let value: any = input[field];
        if (field === 'validationRules' || field === 'options') {
          value = value ? JSON.stringify(value) : null;
        }
        setStatements.push(`"${field}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    const sql = `
      UPDATE "${this.attributeTable}"
      SET ${setStatements.join(', ')}
      WHERE "productAttributeId" = $1
      RETURNING *
    `;

    return await queryOne<ProductAttribute>(sql, values);
  }

  async deleteAttribute(id: string): Promise<boolean> {
    // Delete attribute values first
    await query(`DELETE FROM "${this.attributeValueTable}" WHERE "attributeId" = $1`, [id]);
    // Delete product attribute data
    await query(`DELETE FROM "${this.attributeValueMapTable}" WHERE "attributeId" = $1`, [id]);

    const sql = `DELETE FROM "${this.attributeTable}" WHERE "productAttributeId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  // ==================== ATTRIBUTE VALUE METHODS ====================

  async findAttributeValues(attributeId: string): Promise<ProductAttributeValue[]> {
    const sql = `
      SELECT * FROM "${this.attributeValueTable}" 
      WHERE "attributeId" = $1 
      ORDER BY "position" ASC
    `;
    return (await query<ProductAttributeValue[]>(sql, [attributeId])) || [];
  }

  async createAttributeValue(input: AttributeValueCreateInput): Promise<ProductAttributeValue> {
    const sql = `
      INSERT INTO "${this.attributeValueTable}" (
        "attributeId", "value", "displayValue", "position", "isDefault"
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await queryOne<ProductAttributeValue>(sql, [
      input.attributeId,
      input.value,
      input.displayValue || input.value,
      input.position || 0,
      input.isDefault || false,
    ]);

    if (!result) {
      throw new Error('Failed to create attribute value');
    }

    return result;
  }

  async deleteAttributeValue(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.attributeValueTable}" WHERE "productAttributeValueId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  // ==================== PRODUCT ATTRIBUTE DATA METHODS ====================

  /**
   * Get all attribute values for a product
   */
  async getProductAttributes(productId: string): Promise<Array<ProductAttributeData & { attribute: ProductAttribute }>> {
    const sql = `
      SELECT 
        pav.*,
        pa."productAttributeId" as "attribute_productAttributeId",
        pa."name" as "attribute_name",
        pa."code" as "attribute_code",
        pa."type" as "attribute_type",
        pa."isFilterable" as "attribute_isFilterable",
        pa."isSearchable" as "attribute_isSearchable"
      FROM "${this.attributeValueMapTable}" pav
      JOIN "${this.attributeTable}" pa ON pa."productAttributeId" = pav."attributeId"
      WHERE pav."productId" = $1
    `;

    const results = (await query<any[]>(sql, [productId])) || [];

    return results.map(row => ({
      productAttributeValueMapId: row.productAttributeValueMapId,
      productId: row.productId,
      productVariantId: row.productVariantId,
      attributeId: row.attributeId,
      value: row.value,
      valueText: row.valueText,
      valueNumeric: row.valueNumeric,
      valueBoolean: row.valueBoolean,
      valueJson: row.valueJson,
      valueDate: row.valueDate,
      isSystem: row.isSystem,
      language: row.language,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      attribute: {
        productAttributeId: row.attribute_productAttributeId,
        name: row.attribute_name,
        code: row.attribute_code,
        type: row.attribute_type,
        isFilterable: row.attribute_isFilterable,
        isSearchable: row.attribute_isSearchable,
      } as ProductAttribute,
    }));
  }

  /**
   * Set an attribute value for a product
   */
  async setProductAttribute(input: SetProductAttributeInput): Promise<ProductAttributeData> {
    // Determine value type based on input
    const valueText = typeof input.value === 'string' ? input.value : null;
    const valueNumeric = !isNaN(Number(input.value)) ? Number(input.value) : null;

    const sql = `
      INSERT INTO "${this.attributeValueMapTable}" (
        "productId", "attributeId", "value", "valueText", "valueNumeric"
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await queryOne<ProductAttributeData>(sql, [input.productId, input.attributeId, input.value, valueText, valueNumeric]);

    if (!result) {
      throw new Error('Failed to set product attribute');
    }

    return result;
  }

  /**
   * Set multiple attribute values for a product
   */
  async setProductAttributes(productId: string, attributes: Array<{ attributeId: string; value: string }>): Promise<void> {
    for (const attr of attributes) {
      await this.setProductAttribute({
        productId,
        attributeId: attr.attributeId,
        value: attr.value,
      });
    }
  }

  /**
   * Remove an attribute value from a product
   */
  async removeProductAttribute(productId: string, attributeId: string): Promise<boolean> {
    const sql = `
      DELETE FROM "${this.attributeValueMapTable}" 
      WHERE "productId" = $1 AND "attributeId" = $2
    `;
    const result = await query(sql, [productId, attributeId]);
    return result !== null;
  }

  /**
   * Remove all attribute values from a product
   */
  async clearProductAttributes(productId: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.attributeValueMapTable}" WHERE "productId" = $1`;
    const result = await query(sql, [productId]);
    return result !== null;
  }
}

export default new DynamicAttributeRepository();
