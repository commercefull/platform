import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'push';
export type NotificationType = 'orderStatus' | 'promotion' | 'accountAlert';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'blocked';
export type UserType = 'customer' | 'merchant' | 'admin';

export interface NotificationDeliveryLog {
  notificationDeliveryLogId: string;
  createdAt: string;
  notificationId?: string;
  userId: string;
  userType: UserType;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  status: DeliveryStatus;
  statusDetails?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  provider?: string;
  providerMessageId?: string;
  providerResponse?: Record<string, any>;
  retryCount: number;
}

export type NotificationDeliveryLogCreateParams = Omit<
  NotificationDeliveryLog,
  'notificationDeliveryLogId' | 'createdAt' | 'retryCount' | 'sentAt' | 'deliveredAt' | 'failedAt'
>;

export type NotificationDeliveryLogUpdateParams = Partial<
  Pick<
    NotificationDeliveryLog,
    | 'status'
    | 'statusDetails'
    | 'sentAt'
    | 'deliveredAt'
    | 'failedAt'
    | 'failureReason'
    | 'providerMessageId'
    | 'providerResponse'
    | 'retryCount'
  >
>;

export class NotificationDeliveryLogRepo {
  /**
   * Find delivery log by ID
   */
  async findById(notificationDeliveryLogId: string): Promise<NotificationDeliveryLog | null> {
    return await queryOne<NotificationDeliveryLog>(
      `SELECT * FROM "public"."notificationDeliveryLog" WHERE "notificationDeliveryLogId" = $1`,
      [notificationDeliveryLogId],
    );
  }

  /**
   * Find logs by notification ID
   */
  async findByNotificationId(notificationId: string): Promise<NotificationDeliveryLog[]> {
    const results = await query<NotificationDeliveryLog[]>(
      `SELECT * FROM "public"."notificationDeliveryLog" 
       WHERE "notificationId" = $1 
       ORDER BY "createdAt" DESC`,
      [notificationId],
    );
    return results || [];
  }

  /**
   * Find logs by user
   */
  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<NotificationDeliveryLog[]> {
    const results = await query<NotificationDeliveryLog[]>(
      `SELECT * FROM "public"."notificationDeliveryLog" 
       WHERE "userId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return results || [];
  }

  /**
   * Find logs by status
   */
  async findByStatus(status: DeliveryStatus, limit: number = 100, offset: number = 0): Promise<NotificationDeliveryLog[]> {
    const results = await query<NotificationDeliveryLog[]>(
      `SELECT * FROM "public"."notificationDeliveryLog" 
       WHERE "status" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );
    return results || [];
  }

  /**
   * Find logs by channel
   */
  async findByChannel(channel: NotificationChannel, limit: number = 100, offset: number = 0): Promise<NotificationDeliveryLog[]> {
    const results = await query<NotificationDeliveryLog[]>(
      `SELECT * FROM "public"."notificationDeliveryLog" 
       WHERE "channel" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [channel, limit, offset],
    );
    return results || [];
  }

  /**
   * Find logs by provider
   */
  async findByProvider(provider: string, limit: number = 100, offset: number = 0): Promise<NotificationDeliveryLog[]> {
    const results = await query<NotificationDeliveryLog[]>(
      `SELECT * FROM "public"."notificationDeliveryLog" 
       WHERE "provider" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [provider, limit, offset],
    );
    return results || [];
  }

  /**
   * Find failed deliveries
   */
  async findFailed(limit: number = 100, offset: number = 0): Promise<NotificationDeliveryLog[]> {
    const results = await query<NotificationDeliveryLog[]>(
      `SELECT * FROM "public"."notificationDeliveryLog" 
       WHERE "status" IN ('failed', 'bounced', 'blocked') 
       ORDER BY "createdAt" DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return results || [];
  }

  /**
   * Find pending deliveries (for retry)
   */
  async findPending(limit: number = 100): Promise<NotificationDeliveryLog[]> {
    const results = await query<NotificationDeliveryLog[]>(
      `SELECT * FROM "public"."notificationDeliveryLog" 
       WHERE "status" = 'pending' 
       ORDER BY "createdAt" ASC 
       LIMIT $1`,
      [limit],
    );
    return results || [];
  }

  /**
   * Create delivery log
   */
  async create(params: NotificationDeliveryLogCreateParams): Promise<NotificationDeliveryLog> {
    const now = unixTimestamp();

    const result = await queryOne<NotificationDeliveryLog>(
      `INSERT INTO "public"."notificationDeliveryLog" (
        "notificationId", "userId", "userType", "type", "channel",
        "recipient", "status", "statusDetails", "provider",
        "providerMessageId", "providerResponse", "retryCount",
        "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12)
      RETURNING *`,
      [
        params.notificationId || null,
        params.userId,
        params.userType || 'customer',
        params.type,
        params.channel,
        params.recipient,
        params.status || 'pending',
        params.statusDetails || null,
        params.provider || null,
        params.providerMessageId || null,
        params.providerResponse ? JSON.stringify(params.providerResponse) : null,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create notification delivery log');
    }

    return result;
  }

  /**
   * Update delivery log
   */
  async update(notificationDeliveryLogId: string, params: NotificationDeliveryLogUpdateParams): Promise<NotificationDeliveryLog | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'providerResponse' && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(notificationDeliveryLogId);
    }

    values.push(notificationDeliveryLogId);

    const result = await queryOne<NotificationDeliveryLog>(
      `UPDATE "public"."notificationDeliveryLog" 
       SET ${updateFields.join(', ')}
       WHERE "notificationDeliveryLogId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
  }

  /**
   * Mark as sent
   */
  async markAsSent(notificationDeliveryLogId: string, providerMessageId?: string): Promise<NotificationDeliveryLog | null> {
    return this.update(notificationDeliveryLogId, {
      status: 'sent',
      sentAt: unixTimestamp(),
      providerMessageId,
    });
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(notificationDeliveryLogId: string): Promise<NotificationDeliveryLog | null> {
    return this.update(notificationDeliveryLogId, {
      status: 'delivered',
      deliveredAt: unixTimestamp(),
    });
  }

  /**
   * Mark as failed
   */
  async markAsFailed(notificationDeliveryLogId: string, failureReason: string): Promise<NotificationDeliveryLog | null> {
    const log = await this.findById(notificationDeliveryLogId);

    return this.update(notificationDeliveryLogId, {
      status: 'failed',
      failedAt: unixTimestamp(),
      failureReason,
      retryCount: log ? log.retryCount + 1 : 1,
    });
  }

  /**
   * Mark as bounced
   */
  async markAsBounced(notificationDeliveryLogId: string, failureReason: string): Promise<NotificationDeliveryLog | null> {
    return this.update(notificationDeliveryLogId, {
      status: 'bounced',
      failedAt: unixTimestamp(),
      failureReason,
    });
  }

  /**
   * Mark as blocked
   */
  async markAsBlocked(notificationDeliveryLogId: string, failureReason: string): Promise<NotificationDeliveryLog | null> {
    return this.update(notificationDeliveryLogId, {
      status: 'blocked',
      failedAt: unixTimestamp(),
      failureReason,
    });
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(notificationDeliveryLogId: string): Promise<NotificationDeliveryLog | null> {
    const result = await queryOne<NotificationDeliveryLog>(
      `UPDATE "public"."notificationDeliveryLog" 
       SET "retryCount" = "retryCount" + 1
       WHERE "notificationDeliveryLogId" = $1
       RETURNING *`,
      [notificationDeliveryLogId],
    );

    return result;
  }

  /**
   * Delete delivery log
   */
  async delete(notificationDeliveryLogId: string): Promise<boolean> {
    const result = await queryOne<{ notificationDeliveryLogId: string }>(
      `DELETE FROM "public"."notificationDeliveryLog" 
       WHERE "notificationDeliveryLogId" = $1 
       RETURNING "notificationDeliveryLogId"`,
      [notificationDeliveryLogId],
    );

    return !!result;
  }

  /**
   * Count logs by status
   */
  async countByStatus(status: DeliveryStatus): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM "public"."notificationDeliveryLog" 
       WHERE "status" = $1`,
      [status],
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get delivery statistics
   */
  async getStatistics(timeRange?: { start: string; end: string }): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    blocked: number;
    deliveryRate: number;
  }> {
    let whereClause = '';
    const params: any[] = [];

    if (timeRange) {
      whereClause = `WHERE "createdAt" >= $1 AND "createdAt" <= $2`;
      params.push(timeRange.start, timeRange.end);
    }

    const results = await query<{ status: DeliveryStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count 
       FROM "public"."notificationDeliveryLog" 
       ${whereClause}
       GROUP BY "status"`,
      params,
    );

    const stats: Record<string, number> = {
      total: 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
      blocked: 0,
    };

    if (results) {
      results.forEach(row => {
        stats[row.status] = parseInt(row.count, 10);
        stats.total += parseInt(row.count, 10);
      });
    }

    const deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;

    return {
      ...stats,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    } as any;
  }

  /**
   * Get statistics by channel
   */
  async getStatisticsByChannel(): Promise<Record<NotificationChannel, { sent: number; delivered: number; failed: number }>> {
    const results = await query<{ channel: NotificationChannel; status: DeliveryStatus; count: string }[]>(
      `SELECT "channel", "status", COUNT(*) as count 
       FROM "public"."notificationDeliveryLog" 
       GROUP BY "channel", "status"`,
      [],
    );

    const stats: any = {
      email: { sent: 0, delivered: 0, failed: 0 },
      sms: { sent: 0, delivered: 0, failed: 0 },
      in_app: { sent: 0, delivered: 0, failed: 0 },
      push: { sent: 0, delivered: 0, failed: 0 },
    };

    if (results) {
      results.forEach(row => {
        const count = parseInt(row.count, 10);
        if (row.status === 'sent') stats[row.channel].sent = count;
        else if (row.status === 'delivered') stats[row.channel].delivered = count;
        else if (['failed', 'bounced', 'blocked'].includes(row.status)) {
          stats[row.channel].failed += count;
        }
      });
    }

    return stats;
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = parseInt(unixTimestamp()) - daysToKeep * 24 * 60 * 60;

    const result = await queryOne<{ count: string }>(
      `DELETE FROM "public"."notificationDeliveryLog" 
       WHERE "createdAt" < $1 
       RETURNING COUNT(*) as count`,
      [cutoffDate],
    );

    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new NotificationDeliveryLogRepo();
