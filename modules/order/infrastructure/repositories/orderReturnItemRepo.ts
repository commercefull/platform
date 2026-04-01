import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export type ReturnReason = 'productNotAsDescribed' | 'wrongProduct' | 'damaged' | 'expired' | 'other';
export type ReturnItemCondition = 'new' | 'likeNew' | 'used' | 'damaged' | 'unsellable';

export interface OrderReturnItem {
  orderReturnItemId: string;
  createdAt: string;
  orderReturnId: string;
  orderItemId: string;
  quantity: number;
  returnReason: ReturnReason;
  returnReasonDetail?: string;
  condition: ReturnItemCondition;
  restockItem: boolean;
  refundAmount?: number;
  exchangeProductId?: string;
  exchangeVariantId?: string;
  notes?: string;
  inspectionNotes?: string;
}

export type OrderReturnItemCreateParams = Omit<OrderReturnItem, 'orderReturnItemId' | 'createdAt'>;
export type OrderReturnItemUpdateStatusParams = Partial<Pick<OrderReturnItem, 'condition' | 'restockItem' | 'refundAmount' | 'inspectionNotes'>>;

export const findByReturn = async (orderReturnId: string): Promise<OrderReturnItem[]> => {
  const results = await query<OrderReturnItem[]>(
    `SELECT * FROM "orderReturnItem" WHERE "orderReturnId" = $1 ORDER BY "createdAt" ASC`,
    [orderReturnId],
  );
  return results || [];
};

export const create = async (params: OrderReturnItemCreateParams): Promise<OrderReturnItem> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderReturnItem>(
    `INSERT INTO "orderReturnItem" (
      "orderReturnId", "orderItemId", "quantity", "returnReason", "returnReasonDetail",
      "condition", "restockItem", "refundAmount",
      "exchangeProductId", "exchangeVariantId",
      "notes", "inspectionNotes", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      params.orderReturnId,
      params.orderItemId,
      params.quantity,
      params.returnReason,
      params.returnReasonDetail || null,
      params.condition,
      params.restockItem ?? false,
      params.refundAmount || null,
      params.exchangeProductId || null,
      params.exchangeVariantId || null,
      params.notes || null,
      params.inspectionNotes || null,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderReturnItem');
  return result;
};

export const updateStatus = async (orderReturnItemId: string, params: OrderReturnItemUpdateStatusParams): Promise<OrderReturnItem | null> => {
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
    return queryOne<OrderReturnItem>(`SELECT * FROM "orderReturnItem" WHERE "orderReturnItemId" = $1`, [orderReturnItemId]);
  }

  values.push(orderReturnItemId);

  return queryOne<OrderReturnItem>(
    `UPDATE "orderReturnItem" SET ${fields.join(', ')} WHERE "orderReturnItemId" = $${i} RETURNING *`,
    values,
  );
};

export default { findByReturn, create, updateStatus };
