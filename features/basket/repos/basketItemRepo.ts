import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface BasketItem {
  basketItemId: string;
  createdAt: string;
  updatedAt: string;
  basketId: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  taxAmount: number;
  finalPrice: number;
  imageUrl?: string;
  attributes?: Record<string, any>;
  itemType: string;
  isGift: boolean;
  giftMessage?: string;
}

export type BasketItemCreateParams = Omit<BasketItem, 'basketItemId' | 'createdAt' | 'updatedAt'>;
export type BasketItemUpdateParams = Partial<Pick<BasketItem, 'quantity' | 'unitPrice' | 'totalPrice' | 'discountAmount' | 'taxAmount' | 'finalPrice' | 'attributes' | 'isGift' | 'giftMessage'>>;

export class BasketItemRepo {
  /**
   * Find basket item by ID
   */
  async findById(basketItemId: string): Promise<BasketItem | null> {
    return await queryOne<BasketItem>(
      `SELECT * FROM "public"."basketItem" WHERE "basketItemId" = $1`,
      [basketItemId]
    );
  }

  /**
   * Find all items in a basket
   */
  async findByBasketId(basketId: string): Promise<BasketItem[]> {
    const results = await query<BasketItem[]>(
      `SELECT * FROM "public"."basketItem" WHERE "basketId" = $1 ORDER BY "createdAt" ASC`,
      [basketId]
    );
    return results || [];
  }

  /**
   * Find basket item by product
   */
  async findByProductInBasket(basketId: string, productId: string, productVariantId?: string): Promise<BasketItem | null> {
    if (productVariantId) {
      return await queryOne<BasketItem>(
        `SELECT * FROM "public"."basketItem" 
         WHERE "basketId" = $1 AND "productId" = $2 AND "productVariantId" = $3`,
        [basketId, productId, productVariantId]
      );
    } else {
      return await queryOne<BasketItem>(
        `SELECT * FROM "public"."basketItem" 
         WHERE "basketId" = $1 AND "productId" = $2 AND "productVariantId" IS NULL`,
        [basketId, productId]
      );
    }
  }

  /**
   * Create basket item
   */
  async create(params: BasketItemCreateParams): Promise<BasketItem> {
    const now = unixTimestamp();

    const result = await queryOne<BasketItem>(
      `INSERT INTO "public"."basketItem" (
        "basketId", "productId", "productVariantId", "sku", "name", 
        "quantity", "unitPrice", "totalPrice", "discountAmount", "taxAmount", "finalPrice",
        "imageUrl", "attributes", "itemType", "isGift", "giftMessage",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        params.basketId,
        params.productId,
        params.productVariantId || null,
        params.sku,
        params.name,
        params.quantity,
        params.unitPrice,
        params.totalPrice,
        params.discountAmount,
        params.taxAmount,
        params.finalPrice,
        params.imageUrl || null,
        params.attributes ? JSON.stringify(params.attributes) : null,
        params.itemType,
        params.isGift,
        params.giftMessage || null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create basket item');
    }

    return result;
  }

  /**
   * Update basket item
   */
  async update(basketItemId: string, params: BasketItemUpdateParams): Promise<BasketItem | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'attributes' && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(basketItemId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(basketItemId);

    const result = await queryOne<BasketItem>(
      `UPDATE "public"."basketItem" 
       SET ${updateFields.join(', ')}
       WHERE "basketItemId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Update item quantity
   */
  async updateQuantity(basketItemId: string, quantity: number): Promise<BasketItem | null> {
    const result = await queryOne<BasketItem>(
      `UPDATE "public"."basketItem" 
       SET "quantity" = $1, "updatedAt" = $2
       WHERE "basketItemId" = $3
       RETURNING *`,
      [quantity, unixTimestamp(), basketItemId]
    );

    return result;
  }

  /**
   * Delete basket item
   */
  async delete(basketItemId: string): Promise<boolean> {
    const result = await queryOne<{ basketItemId: string }>(
      `DELETE FROM "public"."basketItem" WHERE "basketItemId" = $1 RETURNING "basketItemId"`,
      [basketItemId]
    );

    return !!result;
  }

  /**
   * Delete all items in a basket
   */
  async deleteByBasketId(basketId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `DELETE FROM "public"."basketItem" WHERE "basketId" = $1 RETURNING COUNT(*) as count`,
      [basketId]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Count items in basket
   */
  async countByBasketId(basketId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "public"."basketItem" WHERE "basketId" = $1`,
      [basketId]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Calculate basket totals
   */
  async calculateTotals(basketId: string): Promise<{
    itemsCount: number;
    subTotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  }> {
    const result = await queryOne<{
      itemsCount: string;
      subTotal: string;
      discountAmount: string;
      taxAmount: string;
      grandTotal: string;
    }>(
      `SELECT 
        COUNT(*) as "itemsCount",
        COALESCE(SUM("quantity"), 0) as "subTotal",
        COALESCE(SUM("discountAmount"), 0) as "discountAmount",
        COALESCE(SUM("taxAmount"), 0) as "taxAmount",
        COALESCE(SUM("finalPrice"), 0) as "grandTotal"
       FROM "public"."basketItem" 
       WHERE "basketId" = $1`,
      [basketId]
    );

    return {
      itemsCount: result ? parseInt(result.itemsCount, 10) : 0,
      subTotal: result ? parseFloat(result.subTotal) : 0,
      discountAmount: result ? parseFloat(result.discountAmount) : 0,
      taxAmount: result ? parseFloat(result.taxAmount) : 0,
      grandTotal: result ? parseFloat(result.grandTotal) : 0
    };
  }
}

export default new BasketItemRepo();
