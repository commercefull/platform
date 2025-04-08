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
      INSERT INTO "public"."cartPromotion" (
        "cartId", "promotionId", "discountAmount", "status", 
        "createdDate", "updatedDate", "deletedFlag", 
        "createdBy", "updatedBy"
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), false, $5, $6) 
      RETURNING *;
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

    // Add each property that exists in props to the update query
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedDate
    updateFields.push(`"updatedDate" = NOW()`);
    
    // Add the cartPromotionId as the last parameter
    params.push(cartPromotionId);

    const sql = `
      UPDATE "public"."cartPromotion"
      SET ${updateFields.join(', ')}
      WHERE "cartPromotionId" = $${paramIndex}
      RETURNING *;
    `;

    const data = await queryOne<CartPromotion>(sql, params);

    if (!data) {
      throw new Error('Cart promotion not found');
    }

    return data;
  }

  async getById(cartPromotionId: string): Promise<CartPromotion | null> {
    const sql = `
      SELECT * FROM "public"."cartPromotion"
      WHERE "cartPromotionId" = $1 AND "deletedFlag" = false;
    `;

    return await queryOne<CartPromotion>(sql, [cartPromotionId]);
  }

  async getByCartId(cartId: string): Promise<CartPromotion[] | null> {
    const sql = `
      SELECT * FROM "public"."cartPromotion"
      WHERE "cartId" = $1 AND "deletedFlag" = false;
    `;

    return await query<CartPromotion[]>(sql, [cartId]);
  }

  async delete(cartPromotionId: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE "public"."cartPromotion"
      SET "deletedFlag" = true, "deletedDate" = NOW(), "deletedBy" = $1
      WHERE "cartPromotionId" = $2;
    `;

    await queryOne(sql, [deletedBy, cartPromotionId]);
  }
}
