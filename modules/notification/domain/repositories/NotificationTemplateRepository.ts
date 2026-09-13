/**
 * Notification Template Repository Port
 *
 * Domain interface for notification template data access.
 */

export type NotificationType = string;

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface NotificationTemplate {
  notificationTemplateId: string;
  createdAt: string;
  updatedAt: string;
  code: string;
  name: string;
  description?: string;
  type: NotificationType;
  supportedChannels: string[];
  defaultChannel: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  pushTemplate?: string;
  smsTemplate?: string;
  parameters?: Record<string, unknown>;
  isActive: boolean;
  categoryCode?: string;
  previewData?: Record<string, unknown>;
  createdBy?: string;
}

export type NotificationTemplateCreateParams = Omit<NotificationTemplate, 'notificationTemplateId' | 'createdAt' | 'updatedAt'>;
export type NotificationTemplateUpdateParams = Partial<
  Omit<NotificationTemplate, 'notificationTemplateId' | 'code' | 'createdAt' | 'updatedAt'>
>;

export interface NotificationTemplateRepository {
  findById(notificationTemplateId: string): Promise<NotificationTemplate | null>;
  findByCode(code: string): Promise<NotificationTemplate | null>;
  findByType(type: NotificationType): Promise<NotificationTemplate | null>;
  findAll(activeOnly?: boolean): Promise<NotificationTemplate[]>;
  findByCategory(categoryCode: string, activeOnly?: boolean): Promise<NotificationTemplate[]>;
  findByChannel(channel: NotificationChannel, activeOnly?: boolean): Promise<NotificationTemplate[]>;
  create(params: NotificationTemplateCreateParams): Promise<NotificationTemplate>;
  update(notificationTemplateId: string, params: NotificationTemplateUpdateParams): Promise<NotificationTemplate | null>;
  updateContent(
    notificationTemplateId: string,
    content: {
      subject?: string;
      htmlTemplate?: string;
      textTemplate?: string;
      pushTemplate?: string;
      smsTemplate?: string;
    },
  ): Promise<NotificationTemplate | null>;
  activate(notificationTemplateId: string): Promise<NotificationTemplate | null>;
  deactivate(notificationTemplateId: string): Promise<NotificationTemplate | null>;
  clone(notificationTemplateId: string, newCode: string, newName: string): Promise<NotificationTemplate>;
  delete(notificationTemplateId: string): Promise<boolean>;
  count(activeOnly?: boolean): Promise<number>;
  search(searchTerm: string, activeOnly?: boolean): Promise<NotificationTemplate[]>;
  getPreview(
    notificationTemplateId: string,
    data?: Record<string, unknown>,
  ): Promise<{
    template: NotificationTemplate;
    compiledHtml?: string;
    compiledText?: string;
    compiledPush?: string;
    compiledSms?: string;
  }>;
}
