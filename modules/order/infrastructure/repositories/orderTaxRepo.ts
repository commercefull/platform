import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export interface OrderTax {
  orderTaxId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderItemId?: string;
  taxType: string;
  name: string;
  rate: number;
  amount: number;
  jurisdiction?: string;
  taxProvider?: string;
  providerTaxId?: string;
  isIncludedInPrice: boolean;
}

export type OrderTaxCreateParams = Omit<OrderTax, 'orderTaxId' | 'createdAt' | 'updatedAt'>;

export const findByOrder = async (orderId: string): Promise<OrderTax[]> => {
  const results = await query<OrderTax[]>(
    `SELECT * FROM "orderTax" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
    [orderId],
  );
  return results || [];
};

export const create = async (params: OrderTaxCreateParams): Promise<OrderTax> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderTax>(
    `INSERT INTO "orderTax" (
      "orderId", "orderItemId", "taxType", "name", "rate", "amount",
      "jurisdiction", "taxProvider", "providerTaxId", "isIncludedInPrice",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      params.orderId,
      params.orderItemId || null,
      params.taxType,
      params.name,
      params.rate,
      params.amount,
      params.jurisdiction || null,
      params.taxProvider || null,
      params.providerTaxId || null,
      params.isIncludedInPrice ?? false,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderTax');
  return result;
};

export default { findByOrder, create };
