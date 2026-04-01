import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export interface OrderNote {
  orderNoteId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  content: string;
  isCustomerVisible: boolean;
  createdBy?: string;
  deletedAt?: string;
}

export type OrderNoteCreateParams = Omit<OrderNote, 'orderNoteId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export const findByOrder = async (orderId: string): Promise<OrderNote[]> => {
  const results = await query<OrderNote[]>(
    `SELECT * FROM "orderNote" WHERE "orderId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
    [orderId],
  );
  return results || [];
};

export const create = async (params: OrderNoteCreateParams): Promise<OrderNote> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderNote>(
    `INSERT INTO "orderNote" (
      "orderId", "content", "isCustomerVisible", "createdBy",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      params.orderId,
      params.content,
      params.isCustomerVisible ?? false,
      params.createdBy || null,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderNote');
  return result;
};

export const softDelete = async (orderNoteId: string): Promise<boolean> => {
  const result = await queryOne<{ orderNoteId: string }>(
    `UPDATE "orderNote" SET "deletedAt" = $1, "updatedAt" = $2 WHERE "orderNoteId" = $3 AND "deletedAt" IS NULL RETURNING "orderNoteId"`,
    [unixTimestamp(), unixTimestamp(), orderNoteId],
  );
  return !!result;
};

export default { findByOrder, create, softDelete };
