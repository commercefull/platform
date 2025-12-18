import { query, queryOne } from "../../../libs/db";
import { Table, PromotionProductDiscount, PromotionProductDiscountItem, PromotionProductDiscountCustomerGroup } from "../../../libs/db/types";

// Table name constants
const DISCOUNT_TABLE = Table.PromotionProductDiscount;
const DISCOUNT_ITEM_TABLE = Table.PromotionProductDiscountItem;
const DISCOUNT_CUSTOMER_GROUP_TABLE = Table.PromotionProductDiscountCustomerGroup;

/**
 * Discount types
 */
export type DiscountType = 'percentage' | 'fixed_amount';

/**
 * Discount applies to types
 */
export type AppliesTo = 'specific_products' | 'all_products';

/**
 * Input for creating a product discount
 */
export interface CreateProductDiscountInput {
  promotionId?: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  currencyCode?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  priority?: number;
  appliesTo?: AppliesTo;
  minimumQuantity?: number;
  maximumQuantity?: number;
  minimumAmount?: number;
  maximumDiscountAmount?: number;
  stackable?: boolean;
  displayOnProductPage?: boolean;
  displayInListing?: boolean;
  badgeText?: string;
  badgeStyle?: Record<string, any>;
  merchantId?: string;
}

/**
 * Input for updating a product discount
 */
export type UpdateProductDiscountInput = Partial<CreateProductDiscountInput>;

/**
 * Input for creating a discount item
 */
export interface CreateDiscountItemInput {
  promotionProductDiscountId: string;
  productId?: string;
  productVariantId?: string;
  productCategoryId?: string;
  productBrandId?: string;
  itemType: 'product' | 'variant' | 'category' | 'brand';
}

/**
 * Repository for managing product discounts
 */
export class DiscountRepo {
  /**
   * Create a new product discount
   */
  async create(input: CreateProductDiscountInput): Promise<PromotionProductDiscount> {
    const now = new Date();
    
    const discount = await queryOne<PromotionProductDiscount>(
      `INSERT INTO "${DISCOUNT_TABLE}" (
        "promotionId", "name", "description", "discountType", "discountValue",
        "currencyCode", "startDate", "endDate", "isActive", "priority",
        "appliesTo", "minimumQuantity", "maximumQuantity", "minimumAmount",
        "maximumDiscountAmount", "stackable", "displayOnProductPage", "displayInListing",
        "badgeText", "badgeStyle", "merchantId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        input.promotionId || null,
        input.name,
        input.description || null,
        input.discountType,
        input.discountValue,
        input.currencyCode || 'USD',
        input.startDate || now,
        input.endDate || null,
        input.isActive !== false,
        input.priority || 0,
        input.appliesTo || 'specific_products',
        input.minimumQuantity || 1,
        input.maximumQuantity || null,
        input.minimumAmount || null,
        input.maximumDiscountAmount || null,
        input.stackable || false,
        input.displayOnProductPage !== false,
        input.displayInListing !== false,
        input.badgeText || null,
        input.badgeStyle ? JSON.stringify(input.badgeStyle) : null,
        input.merchantId || null,
        now,
        now
      ]
    );
    
    if (!discount) {
      throw new Error('Failed to create product discount');
    }
    
    return discount;
  }
  
  /**
   * Update an existing product discount
   */
  async update(id: string, input: UpdateProductDiscountInput): Promise<PromotionProductDiscount> {
    const updateFields: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    const allowedFields = [
      'promotionId', 'name', 'description', 'discountType', 'discountValue',
      'currencyCode', 'startDate', 'endDate', 'isActive', 'priority',
      'appliesTo', 'minimumQuantity', 'maximumQuantity', 'minimumAmount',
      'maximumDiscountAmount', 'stackable', 'displayOnProductPage', 'displayInListing',
      'badgeText', 'badgeStyle', 'merchantId'
    ];
    
    for (const [key, value] of Object.entries(input)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        if (key === 'badgeStyle' && typeof value === 'object') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
        paramIndex++;
      }
    }
    
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    params.push(new Date());
    
    if (updateFields.length === 1) {
      const discount = await this.findById(id);
      if (!discount) {
        throw new Error(`Product discount with id ${id} not found`);
      }
      return discount;
    }
    
    const discount = await queryOne<PromotionProductDiscount>(
      `UPDATE "${DISCOUNT_TABLE}" SET ${updateFields.join(', ')} 
       WHERE "promotionProductDiscountId" = $1 RETURNING *`,
      params
    );
    
    if (!discount) {
      throw new Error(`Product discount with id ${id} not found`);
    }
    
    return discount;
  }
  
  /**
   * Find a product discount by ID
   */
  async findById(id: string): Promise<PromotionProductDiscount | null> {
    return await queryOne<PromotionProductDiscount>(
      `SELECT * FROM "${DISCOUNT_TABLE}" WHERE "promotionProductDiscountId" = $1`,
      [id]
    );
  }
  
  /**
   * Find all product discounts with filters
   */
  async findAll(
    filters: {
      promotionId?: string;
      merchantId?: string;
      isActive?: boolean;
      discountType?: DiscountType;
      startBefore?: Date;
      endAfter?: Date;
    } = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {}
  ): Promise<PromotionProductDiscount[]> {
    const { promotionId, merchantId, isActive, discountType, startBefore, endAfter } = filters;
    const { limit = 50, offset = 0, orderBy = 'priority', direction = 'DESC' } = options;
    
    let sql = `SELECT * FROM "${DISCOUNT_TABLE}" WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (promotionId) {
      sql += ` AND "promotionId" = $${paramIndex}`;
      params.push(promotionId);
      paramIndex++;
    }
    
    if (merchantId) {
      sql += ` AND "merchantId" = $${paramIndex}`;
      params.push(merchantId);
      paramIndex++;
    }
    
    if (isActive !== undefined) {
      sql += ` AND "isActive" = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    if (discountType) {
      sql += ` AND "discountType" = $${paramIndex}`;
      params.push(discountType);
      paramIndex++;
    }
    
    if (startBefore) {
      sql += ` AND "startDate" <= $${paramIndex}`;
      params.push(startBefore);
      paramIndex++;
    }
    
    if (endAfter) {
      sql += ` AND ("endDate" IS NULL OR "endDate" >= $${paramIndex})`;
      params.push(endAfter);
      paramIndex++;
    }
    
    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    return await query<PromotionProductDiscount[]>(sql, params) || [];
  }
  
  /**
   * Find active product discounts
   */
  async findActive(merchantId?: string): Promise<PromotionProductDiscount[]> {
    const now = new Date();
    
    return this.findAll(
      {
        merchantId,
        isActive: true,
        startBefore: now,
        endAfter: now
      },
      {
        orderBy: 'priority',
        direction: 'DESC'
      }
    );
  }
  
  /**
   * Delete a product discount
   */
  async delete(id: string): Promise<boolean> {
    await query('BEGIN');
    
    try {
      // Delete related items first
      await query(`DELETE FROM "${DISCOUNT_ITEM_TABLE}" WHERE "promotionProductDiscountId" = $1`, [id]);
      await query(`DELETE FROM "${DISCOUNT_CUSTOMER_GROUP_TABLE}" WHERE "promotionProductDiscountId" = $1`, [id]);
      
      const result = await queryOne<{ promotionProductDiscountId: string }>(
        `DELETE FROM "${DISCOUNT_TABLE}" WHERE "promotionProductDiscountId" = $1 RETURNING "promotionProductDiscountId"`,
        [id]
      );
      
      await query('COMMIT');
      return !!result;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
  
  // DISCOUNT ITEM METHODS
  
  /**
   * Add an item to a discount
   */
  async addItem(input: CreateDiscountItemInput): Promise<PromotionProductDiscountItem> {
    const now = new Date();
    
    const item = await queryOne<PromotionProductDiscountItem>(
      `INSERT INTO "${DISCOUNT_ITEM_TABLE}" (
        "promotionProductDiscountId", "productId", "productVariantId",
        "productCategoryId", "productBrandId", "itemType", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.promotionProductDiscountId,
        input.productId || null,
        input.productVariantId || null,
        input.productCategoryId || null,
        input.productBrandId || null,
        input.itemType,
        now,
        now
      ]
    );
    
    if (!item) {
      throw new Error('Failed to add discount item');
    }
    
    return item;
  }
  
  /**
   * Find items by discount ID
   */
  async findItemsByDiscountId(discountId: string): Promise<PromotionProductDiscountItem[]> {
    return await query<PromotionProductDiscountItem[]>(
      `SELECT * FROM "${DISCOUNT_ITEM_TABLE}" WHERE "promotionProductDiscountId" = $1`,
      [discountId]
    ) || [];
  }
  
  /**
   * Remove an item from a discount
   */
  async removeItem(itemId: string): Promise<boolean> {
    const result = await queryOne<{ promotionProductDiscountItemId: string }>(
      `DELETE FROM "${DISCOUNT_ITEM_TABLE}" WHERE "promotionProductDiscountItemId" = $1 RETURNING "promotionProductDiscountItemId"`,
      [itemId]
    );
    return !!result;
  }
  
  // CUSTOMER GROUP METHODS
  
  /**
   * Add a customer group to a discount
   */
  async addCustomerGroup(discountId: string, customerGroupId: string): Promise<PromotionProductDiscountCustomerGroup> {
    const now = new Date();
    
    const group = await queryOne<PromotionProductDiscountCustomerGroup>(
      `INSERT INTO "${DISCOUNT_CUSTOMER_GROUP_TABLE}" (
        "promotionProductDiscountId", "customerGroupId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
      [discountId, customerGroupId, now, now]
    );
    
    if (!group) {
      throw new Error('Failed to add customer group to discount');
    }
    
    return group;
  }
  
  /**
   * Find customer groups by discount ID
   */
  async findCustomerGroupsByDiscountId(discountId: string): Promise<PromotionProductDiscountCustomerGroup[]> {
    return await query<PromotionProductDiscountCustomerGroup[]>(
      `SELECT * FROM "${DISCOUNT_CUSTOMER_GROUP_TABLE}" WHERE "promotionProductDiscountId" = $1`,
      [discountId]
    ) || [];
  }
  
  /**
   * Remove a customer group from a discount
   */
  async removeCustomerGroup(groupId: string): Promise<boolean> {
    const result = await queryOne<{ promotionProductDiscountCustomerGroupId: string }>(
      `DELETE FROM "${DISCOUNT_CUSTOMER_GROUP_TABLE}" WHERE "promotionProductDiscountCustomerGroupId" = $1 RETURNING "promotionProductDiscountCustomerGroupId"`,
      [groupId]
    );
    return !!result;
  }
  
  // BUSINESS LOGIC METHODS
  
  /**
   * Find discounts applicable to a product
   */
  async findDiscountsForProduct(productId: string, merchantId?: string): Promise<PromotionProductDiscount[]> {
    const now = new Date();
    
    let sql = `
      SELECT DISTINCT d.* FROM "${DISCOUNT_TABLE}" d
      LEFT JOIN "${DISCOUNT_ITEM_TABLE}" i ON d."promotionProductDiscountId" = i."promotionProductDiscountId"
      WHERE d."isActive" = true
        AND d."startDate" <= $1
        AND (d."endDate" IS NULL OR d."endDate" >= $1)
        AND (
          d."appliesTo" = 'all_products'
          OR (d."appliesTo" = 'specific_products' AND i."productId" = $2)
        )
    `;
    
    const params: any[] = [now, productId];
    let paramIndex = 3;
    
    if (merchantId) {
      sql += ` AND d."merchantId" = $${paramIndex}`;
      params.push(merchantId);
    }
    
    sql += ` ORDER BY d."priority" DESC`;
    
    return await query<PromotionProductDiscount[]>(sql, params) || [];
  }
  
  /**
   * Find discounts applicable to a category
   */
  async findDiscountsForCategory(categoryId: string, merchantId?: string): Promise<PromotionProductDiscount[]> {
    const now = new Date();
    
    let sql = `
      SELECT DISTINCT d.* FROM "${DISCOUNT_TABLE}" d
      LEFT JOIN "${DISCOUNT_ITEM_TABLE}" i ON d."promotionProductDiscountId" = i."promotionProductDiscountId"
      WHERE d."isActive" = true
        AND d."startDate" <= $1
        AND (d."endDate" IS NULL OR d."endDate" >= $1)
        AND (
          d."appliesTo" = 'all_products'
          OR (d."appliesTo" = 'specific_products' AND i."productCategoryId" = $2)
        )
    `;
    
    const params: any[] = [now, categoryId];
    let paramIndex = 3;
    
    if (merchantId) {
      sql += ` AND d."merchantId" = $${paramIndex}`;
      params.push(merchantId);
    }
    
    sql += ` ORDER BY d."priority" DESC`;
    
    return await query<PromotionProductDiscount[]>(sql, params) || [];
  }
  
  /**
   * Calculate discount amount for a given price
   */
  calculateDiscount(discount: PromotionProductDiscount, price: number, quantity: number = 1): number {
    // Check minimum quantity
    if (discount.minimumQuantity && quantity < discount.minimumQuantity) {
      return 0;
    }
    
    // Check maximum quantity
    const applicableQuantity = discount.maximumQuantity 
      ? Math.min(quantity, discount.maximumQuantity) 
      : quantity;
    
    // Check minimum amount
    const totalPrice = price * applicableQuantity;
    if (discount.minimumAmount && totalPrice < Number(discount.minimumAmount)) {
      return 0;
    }
    
    let discountAmount = 0;
    
    if (discount.discountType === 'percentage') {
      discountAmount = (totalPrice * Number(discount.discountValue)) / 100;
    } else {
      discountAmount = Number(discount.discountValue) * applicableQuantity;
    }
    
    // Apply maximum discount cap
    if (discount.maximumDiscountAmount && discountAmount > Number(discount.maximumDiscountAmount)) {
      discountAmount = Number(discount.maximumDiscountAmount);
    }
    
    return Math.min(discountAmount, totalPrice);
  }
}

// Export singleton instance
export const discountRepo = new DiscountRepo();
export default discountRepo;
