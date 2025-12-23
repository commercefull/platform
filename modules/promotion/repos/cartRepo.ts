import { queryOne, query } from '../../../libs/db';
import { Table, CartPromotion } from '../../../libs/db/types';

// Use CartPromotion type directly from libs/db/types.ts
export type { CartPromotion };

type CreateProps = Pick<CartPromotion, 'basketId' | 'promotionId' | 'discountAmount' | 'status'> &
  Partial<Pick<CartPromotion, 'promotionCouponId' | 'couponCode' | 'currencyCode' | 'appliedBy'>>;
type UpdateProps = Partial<Pick<CartPromotion, 'discountAmount' | 'status'>>;

export class CartPromotionRepo {
  async create(props: CreateProps): Promise<CartPromotion> {
    const now = new Date();
    const row = await queryOne<CartPromotion>(
      `INSERT INTO "${Table.CartPromotion}" 
       ("basketId", "promotionId", "promotionCouponId", "couponCode", "discountAmount", "currencyCode", "status", "appliedBy", "appliedAt", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        props.basketId,
        props.promotionId,
        props.promotionCouponId || null,
        props.couponCode || null,
        props.discountAmount,
        props.currencyCode || 'USD',
        props.status,
        props.appliedBy || null,
        now,
        now,
        now,
      ],
    );

    if (!row) {
      throw new Error('Cart promotion not saved');
    }
    return row;
  }

  async update(id: string, props: UpdateProps): Promise<CartPromotion> {
    const now = new Date();
    const updates: string[] = ['"updatedAt" = $1'];
    const values: any[] = [now];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    values.push(id);
    const row = await queryOne<CartPromotion>(
      `UPDATE "${Table.CartPromotion}" 
       SET ${updates.join(', ')} 
       WHERE "cartPromotionId" = $${paramIndex} 
       RETURNING *`,
      values,
    );

    if (!row) {
      throw new Error('Cart promotion not found');
    }
    return row;
  }

  async getById(id: string): Promise<CartPromotion | null> {
    return queryOne<CartPromotion>(`SELECT * FROM "${Table.CartPromotion}" WHERE "cartPromotionId" = $1`, [id]);
  }

  async getByBasketId(basketId: string): Promise<CartPromotion[]> {
    return (await query<CartPromotion[]>(`SELECT * FROM "${Table.CartPromotion}" WHERE "basketId" = $1`, [basketId])) || [];
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM "${Table.CartPromotion}" WHERE "cartPromotionId" = $1`, [id]);
    return result !== null;
  }
}
