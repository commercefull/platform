import { queryOne, query } from "../../../libs/db";
import { BaseNotification, NotificationType } from "../domain/notification";
import { unixTimestamp } from "../../../libs/date";

type NotificationCreateParams = Omit<BaseNotification, 'id' | 'createdAt'>;

/**
 * Mapping dictionaries for converting between database column names (snake_case)
 * and TypeScript interface properties (camelCase)
 */
const dbToTsMapping: Record<string, string> = {
  'id': 'id',
  'user_id': 'userId',
  'user_type': 'userType',
  'type': 'type',
  'title': 'title',
  'content': 'content',
  'channel': 'channel',
  'is_read': 'isRead',
  'read_at': 'readAt',
  'sent_at': 'sentAt',
  'delivered_at': 'deliveredAt',
  'expires_at': 'expiresAt',
  'action_url': 'actionUrl',
  'action_label': 'actionLabel',
  'image_url': 'imageUrl',
  'priority': 'priority',
  'category': 'category',
  'data': 'data',
  'metadata': 'metadata',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt'
};

const tsToDbMapping: Record<string, string> = {
  'id': 'id',
  'userId': 'user_id',
  'userType': 'user_type',
  'type': 'type',
  'title': 'title',
  'content': 'content',
  'channel': 'channel',
  'isRead': 'is_read',
  'readAt': 'read_at',
  'sentAt': 'sent_at',
  'deliveredAt': 'delivered_at',
  'expiresAt': 'expires_at',
  'actionUrl': 'action_url',
  'actionLabel': 'action_label',
  'imageUrl': 'image_url',
  'priority': 'priority',
  'category': 'category',
  'data': 'data',
  'metadata': 'metadata',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at'
};

export class NotificationRepo {
  /**
   * Maps a database column name to TypeScript property name
   */
  private dbToTs(columnName: string): string {
    return dbToTsMapping[columnName] || columnName;
  }

  /**
   * Maps a TypeScript property name to database column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generates a comma-separated list of fields with proper mapping for SELECT queries
   */
  private generateSelectFields(): string {
    return Object.entries(dbToTsMapping)
      .map(([dbField, tsField]) => {
        if (dbField === tsField) {
          return `"${dbField}"`;
        }
        return `"${dbField}" as "${tsField}"`;
      })
      .join(', ');
  }

  /**
   * Maps database results to TypeScript interface
   */
  private mapDbToTs(dbRecord: Record<string, any>): BaseNotification {
    const result: Record<string, any> = {};
    
    for (const [dbField, value] of Object.entries(dbRecord)) {
      const tsField = this.dbToTs(dbField);
      result[tsField] = value;
    }
    
    return result as BaseNotification;
  }

  async findById(id: string): Promise<BaseNotification | null> {
    const queryResult = await queryOne<Record<string, any>>(`SELECT ${this.generateSelectFields()} FROM "public"."notification" WHERE "id" = $1`, [id]);
    return queryResult ? this.mapDbToTs(queryResult) : null;
  }

  async findByUser(userId: string, limit: number = 50): Promise<BaseNotification[]> {
    const queryResult = await query<Record<string, any>[]>(`
      SELECT ${this.generateSelectFields()} 
      FROM "public"."notification" 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `, [userId, limit.toString()]);
    return queryResult ? queryResult.map(record => this.mapDbToTs(record)) : [];
  }

  async findUnreadByUser(userId: string): Promise<BaseNotification[]> {
    const queryResult = await query<Record<string, any>[]>(`
      SELECT ${this.generateSelectFields()} 
      FROM "public"."notification" 
      WHERE "userId" = $1 AND "is_read" = false 
      ORDER BY "createdAt" DESC
    `, [userId]);
    return queryResult ? queryResult.map(record => this.mapDbToTs(record)) : [];
  }

  async findByUserAndType(userId: string, type: NotificationType): Promise<BaseNotification[]> {
    const queryResult = await query<Record<string, any>[]>(`
      SELECT ${this.generateSelectFields()} 
      FROM "public"."notification" 
      WHERE "userId" = $1 AND "type" = $2 
      ORDER BY "createdAt" DESC
    `, [userId, type]);
    return queryResult ? queryResult.map(record => this.mapDbToTs(record)) : [];
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

    const notification = await queryOne<Record<string, any>>(`
      INSERT INTO "public"."notification" (
        "userId", "type", "title", "content", "channel", "is_read", "createdAt", "sent_at", "metadata"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING ${this.generateSelectFields()}
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

    return this.mapDbToTs(notification);
  }

  async markAsRead(id: string): Promise<BaseNotification | null> {
    const queryResult = await queryOne<Record<string, any>>(`
      UPDATE "public"."notification"
      SET "is_read" = true, "updatedAt" = $1
      WHERE "id" = $2
      RETURNING ${this.generateSelectFields()}
    `, [unixTimestamp(), id]);

    return queryResult ? this.mapDbToTs(queryResult) : null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`
      UPDATE "public"."notification"
      SET "is_read" = true, "updatedAt" = $1
      WHERE "userId" = $2 AND "is_read" = false
      RETURNING COUNT(*) as count
    `, [unixTimestamp(), userId]);

    return result ? parseInt(result.count, 10) : 0;
  }

  async markAsSent(id: string): Promise<BaseNotification | null> {
    const queryResult = await queryOne<Record<string, any>>(`
      UPDATE "public"."notification"
      SET "sent_at" = $1, "updatedAt" = $2
      WHERE "id" = $3
      RETURNING ${this.generateSelectFields()}
    `, [unixTimestamp(), unixTimestamp(), id]);

    return queryResult ? this.mapDbToTs(queryResult) : null;
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
      WHERE "userId" = $1 AND "is_read" = false
    `, [userId]);

    return result ? parseInt(result.count, 10) : 0;
  }
}
