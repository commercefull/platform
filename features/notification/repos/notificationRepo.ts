import { queryOne, query } from "../../../libs/db";
import { BaseNotification, NotificationType } from "../domain/notification";
import { unixTimestamp } from "../../../libs/date";

type NotificationCreateParams = Omit<BaseNotification, 'id' | 'createdAt'>;

export class NotificationRepo {
  async findById(id: string): Promise<BaseNotification | null> {
    return await queryOne<BaseNotification>('SELECT * FROM "public"."notification" WHERE "id" = $1', [id]);
  }

  async findByUser(userId: string, limit: number = 50): Promise<BaseNotification[]> {
    const results = await query<BaseNotification[]>('SELECT * FROM "public"."notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2', [userId, limit.toString()]);
    return results || [];
  }

  async findUnreadByUser(userId: string): Promise<BaseNotification[]> {
    const results = await query<BaseNotification[]>('SELECT * FROM "public"."notification" WHERE "userId" = $1 AND "isRead" = false ORDER BY "createdAt" DESC', [userId]);
    return results || [];
  }

  async findByUserAndType(userId: string, type: NotificationType): Promise<BaseNotification[]> {
    const results = await query<BaseNotification[]>('SELECT * FROM "public"."notification" WHERE "userId" = $1 AND "type" = $2 ORDER BY "createdAt" DESC', [userId, type]);
    return results || [];
  }

  async create(params: NotificationCreateParams): Promise<BaseNotification> {
    const {
      userId,
      type,
      title,
      content,
      channel,
      isRead,
      sentAt,
      metadata
    } = params;

    const notification = await queryOne<BaseNotification>(`
      INSERT INTO "public"."notification" (
        "userId", "type", "title", "content", "channel", "isRead", "createdAt", "sentAt", "metadata"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      userId,
      type,
      title,
      content,
      JSON.stringify(channel),
      isRead,
      unixTimestamp(),
      sentAt || null,
      metadata ? JSON.stringify(metadata) : null
    ]);

    if (!notification) {
      throw new Error('Notification not saved');
    }

    return notification;
  }

  async markAsRead(id: string): Promise<BaseNotification | null> {
    return await queryOne<BaseNotification>(`
      UPDATE "public"."notification"
      SET "isRead" = true, "updatedAt" = $1
      WHERE "id" = $2
      RETURNING *
    `, [unixTimestamp(), id]);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`
      UPDATE "public"."notification"
      SET "isRead" = true, "updatedAt" = $1
      WHERE "userId" = $2 AND "isRead" = false
      RETURNING COUNT(*) as count
    `, [unixTimestamp(), userId]);

    return result ? parseInt(result.count, 10) : 0;
  }

  async markAsSent(id: string): Promise<BaseNotification | null> {
    return await queryOne<BaseNotification>(`
      UPDATE "public"."notification"
      SET "sentAt" = $1, "updatedAt" = $2
      WHERE "id" = $3
      RETURNING *
    `, [unixTimestamp(), unixTimestamp(), id]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(`
      DELETE FROM "public"."notification"
      WHERE "id" = $1
      RETURNING "id"
    `, [id]);

    return !!result;
  }

  async deleteAllForUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`
      DELETE FROM "public"."notification"
      WHERE "userId" = $1
      RETURNING COUNT(*) as count
    `, [userId]);

    return result ? parseInt(result.count, 10) : 0;
  }

  async countUnread(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM "public"."notification"
      WHERE "userId" = $1 AND "isRead" = false
    `, [userId]);

    return result ? parseInt(result.count, 10) : 0;
  }
}
