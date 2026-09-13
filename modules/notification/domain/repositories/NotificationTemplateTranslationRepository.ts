/**
 * Notification Template Translation Repository Port
 *
 * Domain interface for notification template translation data access.
 */

export interface NotificationTemplateTranslation {
  notificationTemplateTranslationId: string;
  templateId: string;
  locale: string;
  subject?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplateTranslationRepository {
  findByTemplate(templateId: string): Promise<NotificationTemplateTranslation[]>;
  findByTemplateAndLocale(templateId: string, locale: string): Promise<NotificationTemplateTranslation | null>;
  upsert(
    params: Omit<NotificationTemplateTranslation, 'notificationTemplateTranslationId' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationTemplateTranslation | null>;
}
