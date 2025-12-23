import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type NotificationType =
  | 'account_registration'
  | 'password_reset'
  | 'email_verification'
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'return_initiated'
  | 'refund_processed'
  | 'back_in_stock'
  | 'price_drop'
  | 'new_product'
  | 'review_request'
  | 'abandoned_cart'
  | 'coupon_offer'
  | 'promotion';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface NotificationTemplate {
  notificationTemplateId: string;
  createdAt: string;
  updatedAt: string;
  code: string;
  name: string;
  description?: string;
  type: NotificationType;
  supportedChannels: NotificationChannel;
  defaultChannel: NotificationChannel;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  pushTemplate?: string;
  smsTemplate?: string;
  parameters?: Record<string, any>;
  isActive: boolean;
  categoryCode?: string;
  previewData?: Record<string, any>;
  createdBy?: string;
}

export type NotificationTemplateCreateParams = Omit<NotificationTemplate, 'notificationTemplateId' | 'createdAt' | 'updatedAt'>;
export type NotificationTemplateUpdateParams = Partial<
  Omit<NotificationTemplate, 'notificationTemplateId' | 'code' | 'createdAt' | 'updatedAt'>
>;

export class NotificationTemplateRepo {
  /**
   * Find template by ID
   */
  async findById(notificationTemplateId: string): Promise<NotificationTemplate | null> {
    return await queryOne<NotificationTemplate>(`SELECT * FROM "public"."notificationTemplate" WHERE "notificationTemplateId" = $1`, [
      notificationTemplateId,
    ]);
  }

  /**
   * Find template by code
   */
  async findByCode(code: string): Promise<NotificationTemplate | null> {
    return await queryOne<NotificationTemplate>(`SELECT * FROM "public"."notificationTemplate" WHERE "code" = $1`, [code]);
  }

  /**
   * Find template by type
   */
  async findByType(type: NotificationType): Promise<NotificationTemplate | null> {
    return await queryOne<NotificationTemplate>(`SELECT * FROM "public"."notificationTemplate" WHERE "type" = $1 AND "isActive" = true`, [
      type,
    ]);
  }

  /**
   * Find all templates
   */
  async findAll(activeOnly: boolean = false): Promise<NotificationTemplate[]> {
    let sql = `SELECT * FROM "public"."notificationTemplate"`;

    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<NotificationTemplate[]>(sql);
    return results || [];
  }

  /**
   * Find templates by category
   */
  async findByCategory(categoryCode: string, activeOnly: boolean = true): Promise<NotificationTemplate[]> {
    let sql = `SELECT * FROM "public"."notificationTemplate" WHERE "categoryCode" = $1`;
    const params: any[] = [categoryCode];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<NotificationTemplate[]>(sql, params);
    return results || [];
  }

  /**
   * Find templates by channel
   */
  async findByChannel(channel: NotificationChannel, activeOnly: boolean = true): Promise<NotificationTemplate[]> {
    let sql = `SELECT * FROM "public"."notificationTemplate" WHERE "supportedChannels" = $1`;
    const params: any[] = [channel];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<NotificationTemplate[]>(sql, params);
    return results || [];
  }

  /**
   * Create notification template
   */
  async create(params: NotificationTemplateCreateParams): Promise<NotificationTemplate> {
    const now = unixTimestamp();

    // Check if code already exists
    const existing = await this.findByCode(params.code);
    if (existing) {
      throw new Error(`Template with code '${params.code}' already exists`);
    }

    const result = await queryOne<NotificationTemplate>(
      `INSERT INTO "public"."notificationTemplate" (
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
        params.supportedChannels,
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
      throw new Error('Failed to create notification template');
    }

    return result;
  }

  /**
   * Update notification template
   */
  async update(notificationTemplateId: string, params: NotificationTemplateUpdateParams): Promise<NotificationTemplate | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['parameters', 'previewData'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(notificationTemplateId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(notificationTemplateId);

    const result = await queryOne<NotificationTemplate>(
      `UPDATE "public"."notificationTemplate" 
       SET ${updateFields.join(', ')}
       WHERE "notificationTemplateId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
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
      throw new Error(`Template with ID '${notificationTemplateId}' not found`);
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
      `DELETE FROM "public"."notificationTemplate" WHERE "notificationTemplateId" = $1 RETURNING "notificationTemplateId"`,
      [notificationTemplateId],
    );

    return !!result;
  }

  /**
   * Count templates
   */
  async count(activeOnly: boolean = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "public"."notificationTemplate"`;

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
    let sql = `SELECT * FROM "public"."notificationTemplate" 
               WHERE ("name" ILIKE $1 OR "description" ILIKE $1)`;
    const params: any[] = [`%${searchTerm}%`];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<NotificationTemplate[]>(sql, params);
    return results || [];
  }

  /**
   * Get template with compiled preview
   */
  async getPreview(
    notificationTemplateId: string,
    data?: Record<string, any>,
  ): Promise<{
    template: NotificationTemplate;
    compiledHtml?: string;
    compiledText?: string;
    compiledPush?: string;
    compiledSms?: string;
  }> {
    const template = await this.findById(notificationTemplateId);

    if (!template) {
      throw new Error(`Template with ID '${notificationTemplateId}' not found`);
    }

    const previewData = data || template.previewData || {};

    // Simple template variable replacement ({{variable}})
    const compile = (text?: string): string | undefined => {
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
