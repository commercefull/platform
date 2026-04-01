import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export interface OrderFulfillmentItem {
  orderFulfillmentItemId: string;
  createdAt: string;
  updatedAt: string;
  orderFulfillmentId: string;
  orderItemId: string;
  quantity: number;
}

export type OrderFulfillmentItemCreateParams = Omit<OrderFulfillmentItem, 'orderFulfillmentItemId' | 'createdAt' | 'updatedAt'>;

export const findByFulfillment = async (orderFulfillmentId: string): Promise<OrderFulfillmentItem[]> => {
  const results = await query<OrderFulfillmentItem[]>(
    `SELECT * FROM "orderFulfillmentItem" WHERE "orderFulfillmentId" = $1 ORDER BY "createdAt" ASC`,
    [orderFulfillmentId],
  );
  return results || [];
};

export const create = async (params: OrderFulfillmentItemCreateParams): Promise<OrderFulfillmentItem> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderFulfillmentItem>(
    `INSERT INTO "orderFulfillmentItem" (
      "orderFulfillmentId", "orderItemId", "quantity",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      params.orderFulfillmentId,
      params.orderItemId,
      params.quantity ?? 1,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderFulfillmentItem');
  return result;
};

export default { findByFulfillment, create };
