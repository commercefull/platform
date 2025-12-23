import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';

export interface ProductAttributeSet {
  productAttributeSetId: string;
  name: string;
  code: string;
  description?: string;
  productTypeId?: string;
  isActive: boolean;
  merchantId?: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributeSetWithAttributes extends ProductAttributeSet {
  attributes: ProductAttributeSetAttribute[];
}

export interface ProductAttributeSetAttribute {
  productAttributeId: string;
  name: string;
  code: string;
  type: string;
  isRequired: boolean;
  position: number;
  defaultValue?: string;
}

export interface ProductAttributeSetCreateInput {
  name: string;
  code: string;
  description?: string;
  productTypeId?: string;
  isActive?: boolean;
  merchantId?: string;
  isGlobal?: boolean;
}

export interface ProductAttributeSetUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  productTypeId?: string;
  isActive?: boolean;
}

export interface AttributeSetMappingInput {
  attributeSetId: string;
  attributeId: string;
  position?: number;
  isRequired?: boolean;
  defaultValue?: string;
}

export class ProductAttributeSetRepository {
  private readonly tableName = Table.ProductAttributeSet;
  private readonly mappingTableName = Table.ProductAttributeSetMapping;

  async findById(id: string): Promise<ProductAttributeSet | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "productAttributeSetId" = $1`;
    return await queryOne<ProductAttributeSet>(sql, [id]);
  }

  async findByCode(code: string): Promise<ProductAttributeSet | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "code" = $1`;
    return await queryOne<ProductAttributeSet>(sql, [code]);
  }

  async findByProductType(productTypeId: string): Promise<ProductAttributeSet[]> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "productTypeId" = $1 AND "isActive" = true
      ORDER BY "name" ASC
    `;
    return (await query<ProductAttributeSet[]>(sql, [productTypeId])) || [];
  }

  async findAll(): Promise<ProductAttributeSet[]> {
    const sql = `SELECT * FROM "${this.tableName}" ORDER BY "name" ASC`;
    return (await query<ProductAttributeSet[]>(sql)) || [];
  }

  async findActive(): Promise<ProductAttributeSet[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "isActive" = true ORDER BY "name" ASC`;
    return (await query<ProductAttributeSet[]>(sql)) || [];
  }

  /**
   * Get attribute set with all its attributes
   */
  async findByIdWithAttributes(id: string): Promise<ProductAttributeSetWithAttributes | null> {
    const attributeSet = await this.findById(id);
    if (!attributeSet) return null;

    const sql = `
      SELECT 
        pa."productAttributeId",
        pa."name",
        pa."code",
        pa."type",
        pasm."isRequired",
        pasm."position",
        pasm."defaultValue"
      FROM "${this.mappingTableName}" pasm
      JOIN "${Table.ProductAttribute}" pa ON pa."productAttributeId" = pasm."attributeId"
      WHERE pasm."attributeSetId" = $1
      ORDER BY pasm."position" ASC
    `;

    const attributes = (await query<ProductAttributeSetAttribute[]>(sql, [id])) || [];

    return {
      ...attributeSet,
      attributes,
    };
  }

  /**
   * Get attributes for a product type (via attribute sets)
   */
  async getAttributesForProductType(productTypeId: string): Promise<ProductAttributeSetAttribute[]> {
    const sql = `
      SELECT DISTINCT
        pa."productAttributeId",
        pa."name",
        pa."code",
        pa."type",
        pasm."isRequired",
        pasm."position",
        pasm."defaultValue"
      FROM "${this.tableName}" pas
      JOIN "${this.mappingTableName}" pasm ON pasm."attributeSetId" = pas."productAttributeSetId"
      JOIN "${Table.ProductAttribute}" pa ON pa."productAttributeId" = pasm."attributeId"
      WHERE pas."productTypeId" = $1 AND pas."isActive" = true
      ORDER BY pasm."position" ASC
    `;

    return (await query<ProductAttributeSetAttribute[]>(sql, [productTypeId])) || [];
  }

  async create(input: ProductAttributeSetCreateInput): Promise<ProductAttributeSet> {
    const sql = `
      INSERT INTO "${this.tableName}" (
        "name", "code", "description", "productTypeId", "isActive", "merchantId", "isGlobal"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await queryOne<ProductAttributeSet>(sql, [
      input.name,
      input.code,
      input.description || null,
      input.productTypeId || null,
      input.isActive !== false,
      input.merchantId || null,
      input.isGlobal !== false,
    ]);

    if (!result) {
      throw new Error('Failed to create attribute set');
    }

    return result;
  }

  async update(id: string, input: ProductAttributeSetUpdateInput): Promise<ProductAttributeSet | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
    let paramIndex = 2;

    if (input.name !== undefined) {
      setStatements.push(`"name" = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.code !== undefined) {
      setStatements.push(`"code" = $${paramIndex++}`);
      values.push(input.code);
    }
    if (input.description !== undefined) {
      setStatements.push(`"description" = $${paramIndex++}`);
      values.push(input.description);
    }
    if (input.productTypeId !== undefined) {
      setStatements.push(`"productTypeId" = $${paramIndex++}`);
      values.push(input.productTypeId);
    }
    if (input.isActive !== undefined) {
      setStatements.push(`"isActive" = $${paramIndex++}`);
      values.push(input.isActive);
    }

    const sql = `
      UPDATE "${this.tableName}"
      SET ${setStatements.join(', ')}
      WHERE "productAttributeSetId" = $1
      RETURNING *
    `;

    return await queryOne<ProductAttributeSet>(sql, values);
  }

  async delete(id: string): Promise<boolean> {
    // First delete mappings
    await query(`DELETE FROM "${this.mappingTableName}" WHERE "attributeSetId" = $1`, [id]);

    const sql = `DELETE FROM "${this.tableName}" WHERE "productAttributeSetId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  /**
   * Add an attribute to an attribute set
   */
  async addAttribute(input: AttributeSetMappingInput): Promise<void> {
    const sql = `
      INSERT INTO "${this.mappingTableName}" (
        "attributeSetId", "attributeId", "position", "isRequired", "defaultValue"
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("attributeSetId", "attributeId") DO UPDATE SET
        "position" = EXCLUDED."position",
        "isRequired" = EXCLUDED."isRequired",
        "defaultValue" = EXCLUDED."defaultValue",
        "updatedAt" = now()
    `;

    await query(sql, [input.attributeSetId, input.attributeId, input.position || 0, input.isRequired || false, input.defaultValue || null]);
  }

  /**
   * Remove an attribute from an attribute set
   */
  async removeAttribute(attributeSetId: string, attributeId: string): Promise<boolean> {
    const sql = `
      DELETE FROM "${this.mappingTableName}" 
      WHERE "attributeSetId" = $1 AND "attributeId" = $2
    `;
    const result = await query(sql, [attributeSetId, attributeId]);
    return result !== null;
  }

  /**
   * Reorder attributes in an attribute set
   */
  async reorderAttributes(attributeSetId: string, attributeIds: string[]): Promise<void> {
    for (let i = 0; i < attributeIds.length; i++) {
      await query(
        `UPDATE "${this.mappingTableName}" SET "position" = $1, "updatedAt" = now() 
         WHERE "attributeSetId" = $2 AND "attributeId" = $3`,
        [i, attributeSetId, attributeIds[i]],
      );
    }
  }
}

export default new ProductAttributeSetRepository();
