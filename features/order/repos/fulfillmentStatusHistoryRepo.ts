import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type FulfillmentStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'returned' | 'partiallyDelivered' | 'partiallyReturned' | 'partiallyFailed' | 'partiallyCancelled';

export interface FulfillmentStatusHistory {
  fulfillmentStatusHistoryId: string;
  createdAt: string;
  updatedAt: string;
  orderFulfillmentId: string;
  status: FulfillmentStatus;
  previousStatus?: FulfillmentStatus;
  notes?: string;
  location?: string;
}

export type FulfillmentStatusHistoryCreateParams = Omit<FulfillmentStatusHistory, 'fulfillmentStatusHistoryId' | 'createdAt' | 'updatedAt'>;

export class FulfillmentStatusHistoryRepo {
  async findById(id: string): Promise<FulfillmentStatusHistory | null> {
    return await queryOne<FulfillmentStatusHistory>(
      `SELECT * FROM "fulfillmentStatusHistory" WHERE "fulfillmentStatusHistoryId" = $1`,
      [id]
    );
  }

  async findByFulfillment(orderFulfillmentId: string): Promise<FulfillmentStatusHistory[]> {
    return (await query<FulfillmentStatusHistory[]>(
      `SELECT * FROM "fulfillmentStatusHistory" WHERE "orderFulfillmentId" = $1 ORDER BY "createdAt" DESC`,
      [orderFulfillmentId]
    )) || [];
  }

  async findByStatus(status: FulfillmentStatus, limit = 100): Promise<FulfillmentStatusHistory[]> {
    return (await query<FulfillmentStatusHistory[]>(
      `SELECT * FROM "fulfillmentStatusHistory" WHERE "status" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [status, limit]
    )) || [];
  }

  async create(params: FulfillmentStatusHistoryCreateParams): Promise<FulfillmentStatusHistory> {
    const now = unixTimestamp();
    const result = await queryOne<FulfillmentStatusHistory>(
      `INSERT INTO "fulfillmentStatusHistory" (
        "orderFulfillmentId", "status", "previousStatus", "notes", "location", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        params.orderFulfillmentId, params.status, params.previousStatus || null,
        params.notes || null, params.location || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create fulfillment status history');
    return result;
  }

  async getLatestStatus(orderFulfillmentId: string): Promise<FulfillmentStatusHistory | null> {
    return await queryOne<FulfillmentStatusHistory>(
      `SELECT * FROM "fulfillmentStatusHistory" WHERE "orderFulfillmentId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [orderFulfillmentId]
    );
  }

  async count(orderFulfillmentId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "fulfillmentStatusHistory"`;
    const params: any[] = [];
    if (orderFulfillmentId) {
      sql += ` WHERE "orderFulfillmentId" = $1`;
      params.push(orderFulfillmentId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new FulfillmentStatusHistoryRepo();
