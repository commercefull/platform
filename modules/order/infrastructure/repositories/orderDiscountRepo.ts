import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export type DiscountType = 'percentage' | 'fixedAmount' | 'freeShipping' | 'buyXGetY' | 'giftCard';

export interface OrderDiscount {
  orderDiscountId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderItemId?: string;
  code?: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  discountAmount: number;
}

export type OrderDiscountCreateParams = Omit<OrderDiscount, 'orderDiscountId' | 'createdAt' | 'updatedAt'>;

export const findByOrder = async (orderId: string): Promise<OrderDiscount[]> => {
  const results = await query<OrderDiscount[]>(
    `SELECT * FROM "orderDiscount" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
    [orderId],
  );
  return results || [];
};

export const create = async (params: OrderDiscountCreateParams): Promise<OrderDiscount> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderDiscount>(
    `INSERT INTO "orderDiscount" (
      "orderId", "orderItemId", "code", "name", "description",
      "type", "value", "discountAmount",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      params.orderId,
      params.orderItemId || null,
      params.code || null,
      params.name,
      params.description || null,
      params.type,
      params.value,
      params.discountAmount,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderDiscount');
  return result;
};

export default { findByOrder, create };
