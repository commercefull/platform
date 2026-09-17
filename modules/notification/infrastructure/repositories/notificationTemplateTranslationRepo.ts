import { query, queryOne } from '../../../../libs/db';

// Maps repository-facing field names onto the actual table schema:
// "notificationTemplateId" -> templateId, locale code -> "localeId", body -> "textTemplate".
const TRANSLATION_COLUMNS = `t."notificationTemplateTranslationId", t."notificationTemplateId" AS "templateId", l.code AS locale, t.subject, t."textTemplate" AS body, t."createdAt", t."updatedAt"`;

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
  return (
    (await query<NotificationTemplateTranslation[]>(
      `SELECT ${TRANSLATION_COLUMNS} FROM "notificationTemplateTranslation" t
       JOIN "locale" l ON l."localeId" = t."localeId"
       WHERE t."notificationTemplateId" = $1`,
      [templateId],
    )) || []
  );
}

export async function findByTemplateAndLocale(templateId: string, locale: string): Promise<NotificationTemplateTranslation | null> {
  return queryOne<NotificationTemplateTranslation>(
    `SELECT ${TRANSLATION_COLUMNS} FROM "notificationTemplateTranslation" t
     JOIN "locale" l ON l."localeId" = t."localeId"
     WHERE t."notificationTemplateId" = $1 AND l.code = $2`,
    [templateId, locale],
  );
}

export async function upsert(
  params: Omit<NotificationTemplateTranslation, 'notificationTemplateTranslationId' | 'createdAt' | 'updatedAt'>,
): Promise<NotificationTemplateTranslation | null> {
  const now = new Date();
  return queryOne<NotificationTemplateTranslation>(
    `INSERT INTO "notificationTemplateTranslation" ("notificationTemplateId", "localeId", subject, "textTemplate", "createdAt", "updatedAt")
     SELECT $1, l."localeId", $3, $4, $5, $6 FROM "locale" l WHERE l.code = $2
     ON CONFLICT ("notificationTemplateId", "localeId") DO UPDATE SET subject = $3, "textTemplate" = $4, "updatedAt" = $6
     RETURNING "notificationTemplateTranslationId", "notificationTemplateId" AS "templateId", "localeId"::text AS locale, subject, "textTemplate" AS body, "createdAt", "updatedAt"`,
    [params.templateId, params.locale, params.subject || null, params.body, now, now],
  );
}

export default { findByTemplate, findByTemplateAndLocale, upsert };
