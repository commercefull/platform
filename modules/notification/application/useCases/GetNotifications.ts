/**
 * GetNotifications Use Case
 */

export interface GetNotificationsInput {
  recipientId: string;
  recipientType?: 'customer' | 'merchant' | 'admin';
  channel?: string;
  status?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationItem {
  notificationId: string;
  channel: string;
  subject?: string;
  content: string;
  status: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface GetNotificationsOutput {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface NotificationRecord {
  notificationId: string;
  channel: string;
  subject?: string;
  content: string;
  status?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date | null;
}

export interface GetNotificationsRepository {
  findAll(...args: unknown[]): Promise<NotificationRecord[]>;
  countUnread(recipientId: string): Promise<number>;
}

export class GetNotificationsUseCase {
  constructor(private readonly notificationRepository: GetNotificationsRepository) {}

  async execute(input: GetNotificationsInput): Promise<GetNotificationsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 20;

    const filters: Record<string, unknown> = {
      recipientId: input.recipientId,
    };

    if (input.recipientType) filters.recipientType = input.recipientType;
    if (input.channel) filters.channel = input.channel;
    if (input.status) filters.status = input.status;
    if (input.unreadOnly) filters.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findAll(filters, { page, limit }),
      this.notificationRepository.countUnread(input.recipientId),
    ]);

    return {
      notifications: notifications.map((n) => ({
        notificationId: n.notificationId,
        channel: n.channel,
        subject: n.subject,
        content: n.content,
        status: n.status ?? 'pending',
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString(),
      })),
      total: notifications.length,
      unreadCount,
      page,
      limit,
    };
  }
}
