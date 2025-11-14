import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  inventory: number;
  inventoryPolicy: InventoryPolicy;
  weight?: number | null;
  weightUnit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string | null;
  isDefault: boolean;
  position: number;
  options: VariantOption[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
};

export enum InventoryPolicy {
  DENY = 'deny',
  CONTINUE = 'continue'
}

export type ProductVariantCreateProps = Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductVariantUpdateProps = Partial<Omit<ProductVariant, 'id' | 'productId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export type VariantOption = {
  name: string;
  value: string;
};

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  product_id: 'productId',
  sku: 'sku',
  name: 'name',
  barcode: 'barcode',
  price: 'price',
  compare_at_price: 'compareAtPrice',
  cost_price: 'costPrice',
  inventory: 'inventory',
  inventory_policy: 'inventoryPolicy',
  weight: 'weight',
  weight_unit: 'weightUnit',
  length: 'length',
  width: 'width',
  height: 'height',
  dimension_unit: 'dimensionUnit',
  is_default: 'isDefault',
  position: 'position',
  options: 'options',
  is_active: 'isActive',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  deleted_at: 'deletedAt'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class ProductVariantRepo {
  /**
   * Convert camelCase property name to snake_case column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(fields: string[] = Object.values(dbToTsMapping)): string {
    return fields.map(field => {
      const dbField = this.tsToDb(field);
      return `"${dbField}" AS "${field}"`;
    }).join(', ');
  }

  /**
   * Find a variant by its ID
   */
  async findById(id: string): Promise<ProductVariant | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<ProductVariant>(`SELECT ${selectFields} FROM "public"."product_variant" WHERE "id" = $1 AND "deletedAt" IS NULL`, [id]);
  }

  /**
   * Find a variant by its SKU
   */
  async findBySku(sku: string): Promise<ProductVariant | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<ProductVariant>(`SELECT ${selectFields} FROM "public"."product_variant" WHERE "sku" = $1 AND "deletedAt" IS NULL`, [sku]);
  }

  /**
   * Find variants by product ID
   */
  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const selectFields = this.generateSelectFields();
    return await query<ProductVariant[]>(
      `SELECT ${selectFields} FROM "public"."product_variant" WHERE "productId" = $1 AND "deletedAt" IS NULL ORDER BY "position" ASC`, 
      [productId]
    ) || [];
  }

  /**
   * Find the default variant for a product
   */
  async findDefaultForProduct(productId: string): Promise<ProductVariant | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<ProductVariant>(
      `SELECT ${selectFields} FROM "public"."product_variant" WHERE "productId" = $1 AND "isDefault" = true AND "deletedAt" IS NULL`, 
      [productId]
    );
  }

  /**
   * Create a new product variant
   */
  async create(variant: ProductVariantCreateProps): Promise<ProductVariant> {
    const now = new Date();
    const id = generateUUID();
    
    // Convert property names to DB column names
    const columnMap: Record<string, any> = {
      id,
      created_at: now,
      updated_at: now
    };
    
    // Map all properties to their DB column names
    for (const [key, value] of Object.entries(variant)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDb(key);
        columnMap[dbColumn] = value;
      }
    }
    
    const columns = Object.keys(columnMap);
    const values = Object.values(columnMap);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Create SQL statement with field mapping for the RETURNING clause
    const returnFields = columns.map(col => 
      `"${col}" AS "${dbToTsMapping[col] || col}"`
    ).join(', ');
    
    const sql = `
      INSERT INTO "public"."product_variant" (${columns.map(c => `"${c}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<ProductVariant>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create product variant');
    }
    
    // If this is the default variant, ensure no other variants are set as default
    if (variant.isDefault) {
      await this.updateOtherVariantsNonDefault(id, variant.productId);
    }
    
    return result;
  }

  /**
   * Update a product variant
   */
  async update(id: string, variant: ProductVariantUpdateProps): Promise<ProductVariant> {
    const now = new Date();
    
    // Convert property names to DB column names
    const updateData: Record<string, any> = { updated_at: now };
    
    for (const [key, value] of Object.entries(variant)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDb(key);
        updateData[dbColumn] = value;
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      const existingVariant = await this.findById(id);
      if (!existingVariant) {
        throw new Error('Variant not found');
      }
      return existingVariant;
    }
    
    // Generate set statements for each field
    const setStatements: string[] = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`);
    
    // Create values array with the updated fields
    const values = [
      ...Object.values(updateData),
      id
    ];
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    const sql = `
      UPDATE "public"."product_variant" 
      SET ${setStatements.join(', ')} 
      WHERE "id" = $${values.length} AND "deletedAt" IS NULL 
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<ProductVariant>(sql, values);
    
    if (!result) {
      throw new Error('Failed to update product variant');
    }
    
    // If this variant is now set as default, update other variants
    if (variant.isDefault === true) {
      const existingVariant = await this.findById(id);
      if (existingVariant) {
        await this.updateOtherVariantsNonDefault(id, existingVariant.productId);
      }
    }
    
    return result;
  }

  /**
   * Soft delete a product variant
   * Prevents deleting the master variant (default variant) of a product
   */
  async delete(id: string): Promise<boolean> {
    // First check if this is a default (master) variant
    const variant = await this.findById(id);
    
    if (!variant) {
      return false;
    }
    
    // Prevent deletion of the master variant
    if (variant.isDefault) {
      throw new Error('Cannot delete the master variant of a product. The master variant is required.');
    }
    
    const now = new Date();
    
    await query(
      `UPDATE "public"."product_variant" SET "deletedAt" = $1, "updatedAt" = $2 WHERE "id" = $3`,
      [now, now, id]
    );
    
    return true;
  }

  /**
   * Ensure a master variant exists for a product
   * If no master variant exists, create one based on product data
   */
  async ensureMasterVariantExists(product: any): Promise<ProductVariant | null> {
    // Check if a default variant already exists
    const defaultVariant = await this.findDefaultForProduct(product.id);
    
    if (defaultVariant) {
      return defaultVariant;
    }
    
    // No master variant exists, create one
    try {
      const masterVariant = {
        productId: product.id,
        name: product.name,
        sku: product.sku || `${product.id}-master`,
        price: product.basePrice || 0,
        compareAtPrice: product.salePrice,
        costPrice: product.cost,
        inventory: 0,
        inventoryPolicy: InventoryPolicy.CONTINUE,
        weight: product.weight,
        weightUnit: product.weightUnit,
        length: product.length,
        width: product.width,
        height: product.height,
        dimensionUnit: product.dimensionUnit,
        isDefault: true,  // This is the master variant
        position: 0,      // First position
        options: [],      // No options for master variant
        isActive: true
      };
      
      return await this.create(masterVariant);
    } catch (error) {
      console.error(`Failed to create master variant for product ${product.id}:`, error);
      return null;
    }
  }

  /**
   * Set a variant as the default for a product
   */
  async setDefault(id: string): Promise<ProductVariant> {
    const variant = await this.findById(id);
    
    if (!variant) {
      throw new Error('Variant not found');
    }
    
    const now = new Date();
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    // First, unset default on all variants for this product
    await query(
      `UPDATE "public"."product_variant" SET "isDefault" = false, "updatedAt" = $1 WHERE "productId" = $2 AND "deletedAt" IS NULL`,
      [now, variant.productId]
    );
    
    // Then set this variant as default
    const sql = `
      UPDATE "public"."product_variant" 
      SET "isDefault" = true, "updatedAt" = $1 
      WHERE "id" = $2 AND "deletedAt" IS NULL 
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<ProductVariant>(sql, [now, id]);
    
    if (!result) {
      throw new Error('Failed to set default variant');
    }
    
    return result;
  }

  /**
   * Update inventory quantity for a variant
   */
  async updateInventory(id: string, inventory: number): Promise<ProductVariant> {
    const now = new Date();
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    const sql = `
      UPDATE "public"."product_variant" 
      SET "inventory" = $1, "updatedAt" = $2 
      WHERE "id" = $3 AND "deletedAt" IS NULL 
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<ProductVariant>(sql, [inventory, now, id]);
    
    if (!result) {
      throw new Error('Failed to update inventory');
    }
    
    return result;
  }

  /**
   * Adjust the inventory quantity for a variant by adding or subtracting a value
   */
  async adjustInventory(id: string, adjustmentValue: number): Promise<ProductVariant> {
    const variant = await this.findById(id);
    
    if (!variant) {
      throw new Error('Variant not found');
    }
    
    const newInventory = Math.max(0, variant.inventory + adjustmentValue);
    return await this.updateInventory(id, newInventory);
  }

  /**
   * Reorder variants for a product
   */
  async reorder(productId: string, variantIds: string[]): Promise<boolean> {
    const now = new Date();
    
    // Create statements for reordering
    const queries = variantIds.map((id, index) => ({
      sql: `UPDATE "public"."product_variant" SET "position" = $1, "updatedAt" = $2 WHERE "id" = $3 AND "productId" = $4 AND "deletedAt" IS NULL`,
      params: [index, now, id, productId]
    }));
    
    // Execute all queries
    for (const q of queries) {
      await query(q.sql, q.params);
    }
    
    return true;
  }

  /**
   * Update all other variants for a product to be non-default
   */
  private async updateOtherVariantsNonDefault(currentVariantId: string, productId: string): Promise<void> {
    const now = new Date();
    await query(
      `UPDATE "public"."product_variant" SET "isDefault" = false, "updatedAt" = $1 WHERE "productId" = $2 AND "id" != $3 AND "deletedAt" IS NULL`,
      [now, productId, currentVariantId]
    );
  }
}

export default new ProductVariantRepo();
