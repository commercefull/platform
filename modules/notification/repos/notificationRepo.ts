import { queryOne, query } from '../../../libs/db';

// Import types from generated DB types - single source of truth
import { Notification as DbNotification } from '../../../libs/db/types';

// Re-export DB type
export type Notification = DbNotification;

// Derived types for create/update operations
export type NotificationCreateParams = Partial<Omit<Notification, 'notificationId' | 'createdAt' | 'updatedAt'>> & {
  userId: string;
  userType: string;
  type: string;
  title: string;
  content: string;
  channel: string;
};

export type NotificationUpdateParams = Partial<Omit<Notification, 'notificationId' | 'createdAt' | 'updatedAt'>>;

export class NotificationRepo {
  // ============================================================================
  // Notification CRUD
  // ============================================================================

  async findById(notificationId: string): Promise<Notification | null> {
    return await queryOne<Notification>('SELECT * FROM notification WHERE "notificationId" = $1', [notificationId]);
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const results = await query<Notification[]>('SELECT * FROM notification ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2', [limit, offset]);
    return results || [];
  }

  async findByUser(userId: string, limit: number = 50): Promise<Notification[]> {
    const results = await query<Notification[]>('SELECT * FROM notification WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2', [
      userId,
      limit,
    ]);
    return results || [];
  }

  async findUnreadByUser(userId: string): Promise<Notification[]> {
    const results = await query<Notification[]>(
      'SELECT * FROM notification WHERE "userId" = $1 AND "isRead" = false ORDER BY "createdAt" DESC',
      [userId],
    );
    return results || [];
  }

  async findByUserAndType(userId: string, type: string): Promise<Notification[]> {
    const results = await query<Notification[]>('SELECT * FROM notification WHERE "userId" = $1 AND type = $2 ORDER BY "createdAt" DESC', [
      userId,
      type,
    ]);
    return results || [];
  }

  async create(params: NotificationCreateParams): Promise<Notification> {
    const now = new Date();

    const result = await queryOne<Notification>(
      `INSERT INTO notification (
        "userId", "userType", type, title, content, channel, "isRead", priority,
        category, data, metadata, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        params.userId,
        params.userType || 'customer',
        params.type,
        params.title,
        params.content,
        params.channel,
        params.isRead || false,
        params.priority || 'normal',
        params.category || null,
        params.data ? JSON.stringify(params.data) : null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create notification');
    }

    return result;
  }

  async update(notificationId: string, params: NotificationUpdateParams): Promise<Notification | null> {
    const now = new Date();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        const jsonFields = ['data', 'metadata'];
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return this.findById(notificationId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    values.push(notificationId);

    const result = await queryOne<Notification>(
      `UPDATE notification SET ${updateFields.join(', ')} WHERE "notificationId" = $${paramIndex} RETURNING *`,
      values,
    );

    return result;
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    const now = new Date();
    return await queryOne<Notification>(
      'UPDATE notification SET "isRead" = true, "readAt" = $1, "updatedAt" = $2 WHERE "notificationId" = $3 RETURNING *',
      [now, now, notificationId],
    );
  }

  async markAllAsRead(userId: string): Promise<number> {
    const now = new Date();
    const result = await query<{ notificationId: string }[]>(
      'UPDATE notification SET "isRead" = true, "readAt" = $1, "updatedAt" = $2 WHERE "userId" = $3 AND "isRead" = false RETURNING "notificationId"',
      [now, now, userId],
    );
    return result ? result.length : 0;
  }

  async markAsSent(notificationId: string): Promise<Notification | null> {
    const now = new Date();
    return await queryOne<Notification>('UPDATE notification SET "sentAt" = $1, "updatedAt" = $2 WHERE "notificationId" = $3 RETURNING *', [
      now,
      now,
      notificationId,
    ]);
  }

  async delete(notificationId: string): Promise<boolean> {
    const result = await queryOne<{ notificationId: string }>(
      'DELETE FROM notification WHERE "notificationId" = $1 RETURNING "notificationId"',
      [notificationId],
    );
    return !!result;
  }

  async deleteAllForUser(userId: string): Promise<number> {
    const result = await query<{ notificationId: string }[]>('DELETE FROM notification WHERE "userId" = $1 RETURNING "notificationId"', [
      userId,
    ]);
    return result ? result.length : 0;
  }

  async countUnread(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notification WHERE "userId" = $1 AND "isRead" = false',
      [userId],
    );
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new NotificationRepo();
