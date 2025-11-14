import { queryOne, query } from "../../../libs/db";

export type CartPromotionCreateProps = {
  cartId: string;
  promotionId: string;
  discountAmount: number;
  status: "applied" | "cancelled" | "pending";
  createdBy: string;
  updatedBy: string;
};

export type CartPromotionUpdateProps = Partial<Omit<CartPromotionCreateProps, 'cartId' | 'promotionId'>>;

export interface CartPromotion {
  cartPromotionId: string;
  cartId: string;
  promotionId: string;
  discountAmount: number;
  status: "applied" | "cancelled" | "pending";
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;
  deletedFlag: boolean;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string;
}

export class CartPromotionRepo {
  async create(props: CartPromotionCreateProps): Promise<CartPromotion> {
    const {
      cartId,
      promotionId,
      discountAmount,
      status,
      createdBy,
      updatedBy
    } = props;

    const sql = `
      INSERT INTO "public"."cart_promotion" (
        "cart_id", "promotion_id", "discountAmount", "status", 
        "created_date", "updated_date", "deleted_flag", 
        "created_by", "updated_by"
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), false, $5, $6) 
      RETURNING 
        cart_promotion_id AS "cartPromotionId",
        cart_id AS "cartId",
        promotion_id AS "promotionId",
        discount_amount AS "discountAmount",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy";
    `;

    const data = await queryOne<CartPromotion>(sql, [
      cartId,
      promotionId,
      discountAmount,
      status,
      createdBy,
      updatedBy
    ]);

    if (!data) {
      throw new Error('Cart promotion not saved');
    }

    return data;
  }

  async update(props: CartPromotionUpdateProps, cartPromotionId: string): Promise<CartPromotion> {
    // Create dynamic query based on provided properties
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Map camelCase property names to snake_case column names
    const fieldMappings: Record<string, string> = {
      discountAmount: 'discount_amount',
      createdDate: 'created_date',
      updatedDate: 'updated_date',
      deletedDate: 'deleted_date',
      deletedFlag: 'deleted_flag',
      createdBy: 'created_by',
      updatedBy: 'updated_by',
      deletedBy: 'deleted_by'
    };

    // Add each property that exists in props to the update query
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = fieldMappings[key] || key;
        updateFields.push(`"${dbField}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedDate
    updateFields.push(`"updated_date" = NOW()`);
    
    // Add the cartPromotionId as the last parameter
    params.push(cartPromotionId);

    const sql = `
      UPDATE "public"."cart_promotion"
      SET ${updateFields.join(', ')}
      WHERE "cart_promotion_id" = $${paramIndex}
      RETURNING 
        cart_promotion_id AS "cartPromotionId",
        cart_id AS "cartId",
        promotion_id AS "promotionId",
        discount_amount AS "discountAmount",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy";
    `;

    const data = await queryOne<CartPromotion>(sql, params);

    if (!data) {
      throw new Error('Cart promotion not found');
    }

    return data;
  }

  async getById(cartPromotionId: string): Promise<CartPromotion | null> {
    const sql = `
      SELECT 
        cart_promotion_id AS "cartPromotionId",
        cart_id AS "cartId",
        promotion_id AS "promotionId",
        discount_amount AS "discountAmount",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."cart_promotion"
      WHERE "cart_promotion_id" = $1 AND "deleted_flag" = false;
    `;

    return await queryOne<CartPromotion>(sql, [cartPromotionId]);
  }

  async getByCartId(cartId: string): Promise<CartPromotion[] | null> {
    const sql = `
      SELECT 
        cart_promotion_id AS "cartPromotionId",
        cart_id AS "cartId",
        promotion_id AS "promotionId",
        discount_amount AS "discountAmount",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."cart_promotion"
      WHERE "cart_id" = $1 AND "deleted_flag" = false;
    `;

    return await query<CartPromotion[]>(sql, [cartId]);
  }

  async delete(cartPromotionId: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE "public"."cart_promotion"
      SET "deleted_flag" = true, "deleted_date" = NOW(), "deleted_by" = $1
      WHERE "cart_promotion_id" = $2;
    `;

    await queryOne(sql, [deletedBy, cartPromotionId]);
  }
}
