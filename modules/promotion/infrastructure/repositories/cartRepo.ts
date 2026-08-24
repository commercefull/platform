import { queryOne, query } from '../../../../libs/db';
import { Table, PromotionCart } from '../../../../libs/db/types';
import { FailedToCreatePromotionError, PromotionNotFoundError } from '../../domain/errors/PromotionErrors';

// Use PromotionCart type directly from libs/db/types.ts
export type { PromotionCart };

type CreateProps = Pick<PromotionCart, 'basketId' | 'promotionId' | 'discountAmount' | 'status'> &
  Partial<Pick<PromotionCart, 'promotionCouponId' | 'couponCode' | 'currencyCode' | 'appliedBy'>>;
type UpdateProps = Partial<Pick<PromotionCart, 'discountAmount' | 'status'>>;

export class PromotionCartRepo {
  async create(props: CreateProps): Promise<PromotionCart> {
    const now = new Date();
    const row = await queryOne<PromotionCart>(
      `INSERT INTO "${Table.PromotionCart}" 
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
      throw new FailedToCreatePromotionError('Cart promotion not saved');
    }
    return row;
  }

  async update(id: string, props: UpdateProps): Promise<PromotionCart> {
    const now = new Date();
    const updates: string[] = ['"updatedAt" = $1'];
    const values: unknown[] = [now];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    values.push(id);
    const row = await queryOne<PromotionCart>(
      `UPDATE "${Table.PromotionCart}" 
       SET ${updates.join(', ')} 
       WHERE "cartPromotionId" = $${paramIndex} 
       RETURNING *`,
      values,
    );

    if (!row) {
      throw new PromotionNotFoundError(id);
    }
    return row;
  }

  async getById(id: string): Promise<PromotionCart | null> {
    return queryOne<PromotionCart>(`SELECT * FROM "${Table.PromotionCart}" WHERE "cartPromotionId" = $1`, [id]);
  }

  async getByBasketId(basketId: string): Promise<PromotionCart[]> {
    return (await query<PromotionCart[]>(`SELECT * FROM "${Table.PromotionCart}" WHERE "basketId" = $1`, [basketId])) || [];
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM "${Table.PromotionCart}" WHERE "cartPromotionId" = $1`, [id]);
    return result !== null;
  }
}
