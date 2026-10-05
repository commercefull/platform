import { query, queryOne } from '../../../../libs/db';
import {
  ProductAttribute as DbProductAttribute,
  ProductAttributeValue as DbProductAttributeValue,
  ProductAttributeValueMap,
  Table,
} from '../../../../libs/db/types';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

/**
 * Product Attribute - defines an attribute that can be assigned to products
 */
import type {
  AttributeType,
  ProductAttribute,
  ProductAttributeValue,
  ProductAttributeData,
} from '../../domain/repositories/ProductCatalogPorts';
export type {
  AttributeType,
  ProductAttribute,
  ProductAttributeValue,
  ProductAttributeData,
} from '../../domain/repositories/ProductCatalogPorts';
export type AttributeInputType = AttributeType;

function mapToAttribute(row: DbProductAttribute): ProductAttribute {
  return {
    productAttributeId: row.productAttributeId,
    name: row.name,
    code: row.code,
    type: row.type as AttributeType,
    inputType: (row.inputType ?? row.type) as AttributeType,
    isRequired: row.isRequired,
    isUnique: row.isUnique,
    isSystem: row.isSystem,
    isSearchable: row.isSearchable,
    isFilterable: row.isFilterable,
    isComparable: row.isComparable,
    isVisibleOnFront: row.isVisibleOnFront,
    isUsedInProductListing: row.isUsedInProductListing,
    position: row.position,
    useForVariants: row.useForVariants,
    useForConfigurations: row.useForConfigurations,
    description: row.description ?? undefined,
    groupId: row.groupId ?? undefined,
    defaultValue: row.defaultValue ?? undefined,
    validationRules: (row.validationRules as Record<string, unknown> | null) ?? undefined,
    options: (row.options as Record<string, unknown> | null) ?? undefined,
    organizationId: row.organizationId ?? undefined,
    isGlobal: row.isGlobal,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
}

function mapToAttributeValue(row: DbProductAttributeValue): ProductAttributeValue {
  return {
    productAttributeValueId: row.productAttributeValueId,
    attributeId: row.attributeId,
    value: row.value,
    position: row.position ?? 0,
    isDefault: row.isDefault,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
    displayValue: row.displayValue ?? undefined,
  };
}

function mapToAttributeData(row: ProductAttributeValueMap): ProductAttributeData {
  return {
    productAttributeValueMapId: row.productAttributeValueMapId,
    productId: row.productId,
    attributeId: row.attributeId,
    productVariantId: row.productVariantId ?? undefined,
    value: row.value ?? undefined,
    valueText: row.valueText ?? undefined,
    valueNumeric: row.valueNumeric != null ? Number(row.valueNumeric) : undefined,
    valueBoolean: row.valueBoolean ?? undefined,
    valueJson: (row.valueJson as Record<string, unknown> | null) ?? undefined,
    valueDate: row.valueDate ?? undefined,
  };
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
  validationRules?: Record<string, unknown>;
  options?: Record<string, unknown>;
  organizationId?: string;
  isGlobal?: boolean;
}

export type ProductAttributeUpdateInput = Partial<ProductAttributeCreateInput>;

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
    const row = await queryOne<DbProductAttribute>(sql, [id]);
    return row ? mapToAttribute(row) : null;
  }

  async findAttributeByCode(code: string): Promise<ProductAttribute | null> {
    const sql = `SELECT * FROM "${this.attributeTable}" WHERE "code" = $1`;
    const row = await queryOne<DbProductAttribute>(sql, [code]);
    return row ? mapToAttribute(row) : null;
  }

  async findAllAttributes(): Promise<ProductAttribute[]> {
    const sql = `SELECT * FROM "${this.attributeTable}" ORDER BY "position" ASC, "name" ASC`;
    return ((await query<DbProductAttribute[]>(sql)) || []).map(mapToAttribute);
  }

  async findAttributesByGroup(groupId: string): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "groupId" = $1 
      ORDER BY "position" ASC, "name" ASC
    `;
    return ((await query<DbProductAttribute[]>(sql, [groupId])) || []).map(mapToAttribute);
  }

  async findSearchableAttributes(): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "isSearchable" = true 
      ORDER BY "position" ASC
    `;
    return ((await query<DbProductAttribute[]>(sql)) || []).map(mapToAttribute);
  }

  async findFilterableAttributes(): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "isFilterable" = true 
      ORDER BY "position" ASC
    `;
    return ((await query<DbProductAttribute[]>(sql)) || []).map(mapToAttribute);
  }

  async findVariantAttributes(): Promise<ProductAttribute[]> {
    const sql = `
      SELECT * FROM "${this.attributeTable}" 
      WHERE "useForVariants" = true 
      ORDER BY "position" ASC
    `;
    return ((await query<DbProductAttribute[]>(sql)) || []).map(mapToAttribute);
  }

  async createAttribute(input: ProductAttributeCreateInput): Promise<ProductAttribute> {
    const sql = `
      INSERT INTO "${this.attributeTable}" (
        "name", "code", "description", "groupId", "type", "inputType",
        "isRequired", "isUnique", "isSearchable", "isFilterable", "isComparable",
        "isVisibleOnFront", "isUsedInProductListing", "useForVariants", "useForConfigurations",
        "position", "defaultValue", "validationRules", "options", "organizationId", "isGlobal"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const result = await queryOne<DbProductAttribute>(sql, [
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
      input.organizationId || null,
      input.isGlobal !== false,
    ]);

    if (!result) {
      throw new FailedToCreateProductError();
    }

    return mapToAttribute(result);
  }

  async updateAttribute(id: string, input: ProductAttributeUpdateInput): Promise<ProductAttribute | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: unknown[] = [id];
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
        let value: unknown = input[field];
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

    const row = await queryOne<DbProductAttribute>(sql, values);
    return row ? mapToAttribute(row) : null;
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
    return ((await query<DbProductAttributeValue[]>(sql, [attributeId])) || []).map(mapToAttributeValue);
  }

  async createAttributeValue(input: AttributeValueCreateInput): Promise<ProductAttributeValue> {
    const sql = `
      INSERT INTO "${this.attributeValueTable}" (
        "attributeId", "value", "displayValue", "position", "isDefault"
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await queryOne<DbProductAttributeValue>(sql, [
      input.attributeId,
      input.value,
      input.displayValue || input.value,
      input.position || 0,
      input.isDefault || false,
    ]);

    if (!result) {
      throw new FailedToCreateProductError();
    }

    return mapToAttributeValue(result);
  }

  async deleteAttributeValue(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.attributeValueTable}" WHERE "productAttributeValueId" = $1`;
    await query(sql, [id]);
    // DELETE queries don't return rows, so we can't check result !== null
    // We assume success if no error was thrown
    return true;
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

    const results = (await query<Array<Record<string, unknown>>>(sql, [productId])) || [];

    return results.map(row => ({
      productAttributeValueMapId: row.productAttributeValueMapId as string,
      productId: row.productId as string,
      productVariantId: (row.productVariantId as string | null) ?? undefined,
      attributeId: row.attributeId as string,
      value: (row.value as string | null) ?? undefined,
      valueText: (row.valueText as string | null) ?? undefined,
      valueNumeric: row.valueNumeric != null ? Number(row.valueNumeric) : undefined,
      valueBoolean: (row.valueBoolean as boolean | null) ?? undefined,
      valueJson: (row.valueJson as Record<string, unknown> | null) ?? undefined,
      valueDate: (row.valueDate as Date | null) ?? undefined,
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

    const result = await queryOne<ProductAttributeValueMap>(sql, [
      input.productId,
      input.attributeId,
      input.value,
      valueText,
      valueNumeric,
    ]);

    if (!result) {
      throw new FailedToCreateProductError();
    }

    return mapToAttributeData(result);
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
