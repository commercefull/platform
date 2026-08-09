/**
 * SendNotification Use Case
 */

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SendNotificationInput {
  recipientId: string;
  recipientType: 'customer' | 'merchant' | 'admin';
  templateId?: string;
  channel: NotificationChannel;
  subject?: string;
  content: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
}

export interface SendNotificationOutput {
  notificationId: string;
  channel: NotificationChannel;
  status: 'queued' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
}

export interface SendNotificationRepository {
  create(params: Record<string, unknown>): Promise<unknown>;
  updateStatus?(notificationId: string, status: string, errorMessage?: string): Promise<void>;
}

export interface NotificationService {
  send?(params: { channel: NotificationChannel; recipientId: string; subject?: string; content: string; data?: Record<string, unknown> }): Promise<void>;
}

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: SendNotificationRepository,
    private readonly notificationService: NotificationService | SendNotificationRepository,
  ) {}

  async execute(input: SendNotificationInput): Promise<SendNotificationOutput> {
    if (!input.recipientId || !input.channel || !input.content) {
      throw new Error('Recipient ID, channel, and content are required');
    }

    const notificationId = `ntf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Create notification record
    await this.notificationRepository.create({
      notificationId,
      recipientId: input.recipientId,
      recipientType: input.recipientType,
      templateId: input.templateId,
      channel: input.channel,
      subject: input.subject,
      content: input.content,
      data: input.data,
      priority: input.priority || 'normal',
      scheduledAt: input.scheduledAt,
      status: input.scheduledAt ? 'scheduled' : 'pending',
    });

    // If not scheduled, send immediately
    if (!input.scheduledAt) {
      try {
        if ('send' in this.notificationService && typeof this.notificationService.send === 'function') {
          await this.notificationService.send({
            channel: input.channel,
            recipientId: input.recipientId,
            subject: input.subject,
            content: input.content,
            data: input.data,
          });
        }

        if (this.notificationRepository.updateStatus) {
          await this.notificationRepository.updateStatus(notificationId, 'sent');
        }

        return {
          notificationId,
          channel: input.channel,
          status: 'sent',
          sentAt: new Date().toISOString(),
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (this.notificationRepository.updateStatus) {
          await this.notificationRepository.updateStatus(notificationId, 'failed', errorMessage);
        }

        return {
          notificationId,
          channel: input.channel,
          status: 'failed',
          error: errorMessage,
        };
      }
    }

    return {
      notificationId,
      channel: input.channel,
      status: 'queued',
    };
  }
}
