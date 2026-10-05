import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import type { NotificationTemplate as DbNotificationTemplate } from '../../../../libs/db/types';
import {
  NotificationTemplateNotFoundError,
  NotificationTemplateAlreadyExistsError,
  FailedToCreateNotificationTemplateError,
} from '../../domain/errors/NotificationErrors';

import type {
  NotificationType,
  NotificationChannel,
  NotificationTemplate,
  NotificationTemplateCreateParams,
  NotificationTemplateUpdateParams,
} from '../../domain/repositories/NotificationTemplateRepository';
export type {
  NotificationType,
  NotificationChannel,
  NotificationTemplate,
  NotificationTemplateCreateParams,
  NotificationTemplateUpdateParams,
} from '../../domain/repositories/NotificationTemplateRepository';

function mapToTemplate(row: DbNotificationTemplate): NotificationTemplate {
  return {
    ...row,
    description: row.description ?? undefined,
    supportedChannels: (row.supportedChannels as string[]) ?? [],
    subject: row.subject ?? undefined,
    htmlTemplate: row.htmlTemplate ?? undefined,
    textTemplate: row.textTemplate ?? undefined,
    pushTemplate: row.pushTemplate ?? undefined,
    smsTemplate: row.smsTemplate ?? undefined,
    parameters: (row.parameters as Record<string, unknown> | null) ?? undefined,
    categoryCode: row.categoryCode ?? undefined,
    previewData: (row.previewData as Record<string, unknown> | null) ?? undefined,
    createdBy: row.createdBy ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
}

export class NotificationTemplateRepo {
  /**
   * Find template by ID
   */
  async findById(notificationTemplateId: string): Promise<NotificationTemplate | null> {
    const row = await queryOne<DbNotificationTemplate>(`SELECT * FROM "notificationTemplate" WHERE "notificationTemplateId" = $1`, [
      notificationTemplateId,
    ]);
    return row ? mapToTemplate(row) : null;
  }

  /**
   * Find template by code
   */
  async findByCode(code: string): Promise<NotificationTemplate | null> {
    const row = await queryOne<DbNotificationTemplate>(`SELECT * FROM "notificationTemplate" WHERE "code" = $1`, [code]);
    return row ? mapToTemplate(row) : null;
  }

  /**
   * Find template by type
   */
  async findByType(type: NotificationType): Promise<NotificationTemplate | null> {
    const row = await queryOne<DbNotificationTemplate>(`SELECT * FROM "notificationTemplate" WHERE "type" = $1 AND "isActive" = true`, [
      type,
    ]);
    return row ? mapToTemplate(row) : null;
  }

  /**
   * Find all templates
   */
  async findAll(activeOnly: boolean = false): Promise<NotificationTemplate[]> {
    let sql = `SELECT * FROM "notificationTemplate"`;

    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<DbNotificationTemplate[]>(sql);
    return (results || []).map(mapToTemplate);
  }

  /**
   * Find templates by category
   */
  async findByCategory(categoryCode: string, activeOnly: boolean = true): Promise<NotificationTemplate[]> {
    let sql = `SELECT * FROM "notificationTemplate" WHERE "categoryCode" = $1`;
    const params: unknown[] = [categoryCode];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<DbNotificationTemplate[]>(sql, params);
    return (results || []).map(mapToTemplate);
  }

  /**
   * Find templates by channel
   */
  async findByChannel(channel: NotificationChannel, activeOnly: boolean = true): Promise<NotificationTemplate[]> {
    let sql = `SELECT * FROM "notificationTemplate" WHERE "supportedChannels" @> $1::jsonb`;
    const params: unknown[] = [JSON.stringify([channel])];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<DbNotificationTemplate[]>(sql, params);
    return (results || []).map(mapToTemplate);
  }

  /**
   * Create notification template
   */
  async create(params: NotificationTemplateCreateParams): Promise<NotificationTemplate> {
    const now = unixTimestamp();

    // Check if code already exists
    const existing = await this.findByCode(params.code);
    if (existing) {
      throw new NotificationTemplateAlreadyExistsError(params.code);
    }

    const result = await queryOne<DbNotificationTemplate>(
      `INSERT INTO "notificationTemplate" (
        "code", "name", "description", "type", "supportedChannels", "defaultChannel",
        "subject", "htmlTemplate", "textTemplate", "pushTemplate", "smsTemplate",
        "parameters", "isActive", "categoryCode", "previewData", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *`,
      [
        params.code,
        params.name,
        params.description || null,
        params.type,
        JSON.stringify(params.supportedChannels),
        params.defaultChannel,
        params.subject || null,
        params.htmlTemplate || null,
        params.textTemplate || null,
        params.pushTemplate || null,
        params.smsTemplate || null,
        params.parameters ? JSON.stringify(params.parameters) : null,
        params.isActive !== undefined ? params.isActive : true,
        params.categoryCode || null,
        params.previewData ? JSON.stringify(params.previewData) : null,
        params.createdBy || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateNotificationTemplateError();
    }

    return mapToTemplate(result);
  }

  /**
   * Update notification template
   */
  async update(notificationTemplateId: string, params: NotificationTemplateUpdateParams): Promise<NotificationTemplate | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['parameters', 'previewData', 'supportedChannels'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(notificationTemplateId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(notificationTemplateId);

    const result = await queryOne<DbNotificationTemplate>(
      `UPDATE "notificationTemplate" 
       SET ${updateFields.join(', ')}
       WHERE "notificationTemplateId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result ? mapToTemplate(result) : null;
  }

  /**
   * Update template content
   */
  async updateContent(
    notificationTemplateId: string,
    content: {
      subject?: string;
      htmlTemplate?: string;
      textTemplate?: string;
      pushTemplate?: string;
      smsTemplate?: string;
    },
  ): Promise<NotificationTemplate | null> {
    return this.update(notificationTemplateId, content);
  }

  /**
   * Activate template
   */
  async activate(notificationTemplateId: string): Promise<NotificationTemplate | null> {
    return this.update(notificationTemplateId, { isActive: true });
  }

  /**
   * Deactivate template
   */
  async deactivate(notificationTemplateId: string): Promise<NotificationTemplate | null> {
    return this.update(notificationTemplateId, { isActive: false });
  }

  /**
   * Clone template
   */
  async clone(notificationTemplateId: string, newCode: string, newName: string): Promise<NotificationTemplate> {
    const original = await this.findById(notificationTemplateId);

    if (!original) {
      throw new NotificationTemplateNotFoundError(notificationTemplateId);
    }

    const cloneParams: NotificationTemplateCreateParams = {
      code: newCode,
      name: newName,
      description: original.description,
      type: original.type,
      supportedChannels: original.supportedChannels,
      defaultChannel: original.defaultChannel,
      subject: original.subject,
      htmlTemplate: original.htmlTemplate,
      textTemplate: original.textTemplate,
      pushTemplate: original.pushTemplate,
      smsTemplate: original.smsTemplate,
      parameters: original.parameters,
      isActive: false, // Cloned templates are inactive by default
      categoryCode: original.categoryCode,
      previewData: original.previewData,
      createdBy: original.createdBy,
    };

    return this.create(cloneParams);
  }

  /**
   * Delete template
   */
  async delete(notificationTemplateId: string): Promise<boolean> {
    const result = await queryOne<{ notificationTemplateId: string }>(
      `DELETE FROM "notificationTemplate" WHERE "notificationTemplateId" = $1 RETURNING "notificationTemplateId"`,
      [notificationTemplateId],
    );

    return !!result;
  }

  /**
   * Count templates
   */
  async count(activeOnly: boolean = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "notificationTemplate"`;

    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }

    const result = await queryOne<{ count: string }>(sql);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Search templates by name or description
   */
  async search(searchTerm: string, activeOnly: boolean = true): Promise<NotificationTemplate[]> {
    let sql = `SELECT * FROM "notificationTemplate" 
               WHERE ("name" ILIKE $1 OR "description" ILIKE $1)`;
    const params: unknown[] = [`%${searchTerm}%`];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<DbNotificationTemplate[]>(sql, params);
    return (results || []).map(mapToTemplate);
  }

  /**
   * Get template with compiled preview
   */
  async getPreview(
    notificationTemplateId: string,
    data?: Record<string, unknown>,
  ): Promise<{
    template: NotificationTemplate;
    compiledHtml?: string;
    compiledText?: string;
    compiledPush?: string;
    compiledSms?: string;
  }> {
    const template = await this.findById(notificationTemplateId);

    if (!template) {
      throw new NotificationTemplateNotFoundError(notificationTemplateId);
    }

    const previewData = (data || template.previewData || {}) as Record<string, unknown>;

    // Simple template variable replacement ({{variable}})
    const compile = (text?: string | null): string | undefined => {
      if (!text) return undefined;

      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return previewData[key] !== undefined ? String(previewData[key]) : match;
      });
    };

    return {
      template,
      compiledHtml: compile(template.htmlTemplate),
      compiledText: compile(template.textTemplate),
      compiledPush: compile(template.pushTemplate),
      compiledSms: compile(template.smsTemplate),
    };
  }
}

export default new NotificationTemplateRepo();
