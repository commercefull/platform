import { query, queryOne } from '../../../../libs/db';

export interface NotificationTemplateTranslation {
  notificationTemplateTranslationId: string;
  templateId: string;
  locale: string;
  subject?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByTemplate(templateId: string): Promise<NotificationTemplateTranslation[]> {
  return (await query<NotificationTemplateTranslation[]>(
    `SELECT * FROM "notificationTemplateTranslation" WHERE "templateId" = $1`,
    [templateId],
  )) || [];
}

export async function findByTemplateAndLocale(templateId: string, locale: string): Promise<NotificationTemplateTranslation | null> {
  return queryOne<NotificationTemplateTranslation>(
    `SELECT * FROM "notificationTemplateTranslation" WHERE "templateId" = $1 AND locale = $2`,
    [templateId, locale],
  );
}

export async function upsert(params: Omit<NotificationTemplateTranslation, 'notificationTemplateTranslationId' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplateTranslation | null> {
  const now = new Date();
  return queryOne<NotificationTemplateTranslation>(
    `INSERT INTO "notificationTemplateTranslation" ("templateId", locale, subject, body, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("templateId", locale) DO UPDATE SET subject = $3, body = $4, "updatedAt" = $6
     RETURNING *`,
    [params.templateId, params.locale, params.subject || null, params.body, now, now],
  );
}

export default { findByTemplate, findByTemplateAndLocale, upsert };
