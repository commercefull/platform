import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export interface OrderShipping {
  orderShippingId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  shippingMethod: string;
  carrier?: string;
  service?: string;
  amount: number;
  taxAmount?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
}

export type OrderShippingCreateParams = Omit<OrderShipping, 'orderShippingId' | 'createdAt' | 'updatedAt'>;
export type OrderShippingUpdateParams = Partial<
  Pick<OrderShipping, 'shippingMethod' | 'carrier' | 'service' | 'amount' | 'taxAmount' | 'trackingNumber' | 'trackingUrl' | 'estimatedDeliveryDate'>
>;

export const findByOrder = async (orderId: string): Promise<OrderShipping[]> => {
  const results = await query<OrderShipping[]>(
    `SELECT * FROM "orderShipping" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
    [orderId],
  );
  return results || [];
};

export const create = async (params: OrderShippingCreateParams): Promise<OrderShipping> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderShipping>(
    `INSERT INTO "orderShipping" (
      "orderId", "shippingMethod", "carrier", "service", "amount",
      "taxAmount", "trackingNumber", "trackingUrl", "estimatedDeliveryDate",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      params.orderId,
      params.shippingMethod,
      params.carrier || null,
      params.service || null,
      params.amount,
      params.taxAmount || null,
      params.trackingNumber || null,
      params.trackingUrl || null,
      params.estimatedDeliveryDate || null,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderShipping');
  return result;
};

export const update = async (orderShippingId: string, params: OrderShippingUpdateParams): Promise<OrderShipping | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      fields.push(`"${key}" = $${i++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return queryOne<OrderShipping>(`SELECT * FROM "orderShipping" WHERE "orderShippingId" = $1`, [orderShippingId]);
  }

  fields.push(`"updatedAt" = $${i++}`);
  values.push(unixTimestamp());
  values.push(orderShippingId);

  return queryOne<OrderShipping>(
    `UPDATE "orderShipping" SET ${fields.join(', ')} WHERE "orderShippingId" = $${i} RETURNING *`,
    values,
  );
};

export default { findByOrder, create, update };
