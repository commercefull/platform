import { ForbiddenError } from '../../../../libs/errors';
import { NotificationNotFoundError, NotificationValidationError } from '../../domain/errors/NotificationErrors';

interface NotificationRecord {
  userId: string;
  [key: string]: unknown;
}

export interface CreateNotificationRecordParams {
  userId: string;
  userType: string;
  type: string;
  title: string;
  content: string;
  channel: string;
  priority: string;
  category?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface NotificationRecordPort {
  findAll(limit?: number, offset?: number): Promise<NotificationRecord[]>;
  findById(id: string): Promise<NotificationRecord | null>;
  create(params: CreateNotificationRecordParams): Promise<NotificationRecord>;
  update(id: string, params: Record<string, unknown>): Promise<NotificationRecord | null>;
  delete(id: string): Promise<boolean>;
  markAsSent(id: string): Promise<NotificationRecord | null>;
  markAsRead(id: string): Promise<NotificationRecord | null>;
  markAllAsRead(userId: string): Promise<number>;
  findUnreadByUser(userId: string): Promise<NotificationRecord[]>;
  findByUser(userId: string, limit?: number): Promise<NotificationRecord[]>;
  countUnread(userId: string): Promise<number>;
}

export class ManageNotificationRecordsUseCase {
  constructor(private readonly notificationRepo: NotificationRecordPort) {}

  async list(limit: number, offset: number) {
    return this.notificationRepo.findAll(limit, offset);
  }

  async getById(id: string) {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) {
      throw new NotificationNotFoundError(id);
    }
    return notification;
  }

  async create(params: {
    userId?: string;
    userType?: string;
    type?: string;
    title?: string;
    content?: string;
    channel?: string;
    priority?: string;
    category?: string;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    if (!params.userId || !params.type || !params.title || !params.content || !params.channel) {
      throw new NotificationValidationError('userId, type, title, content, and channel are required');
    }
    return this.notificationRepo.create({
      userId: params.userId,
      userType: params.userType || 'customer',
      type: params.type,
      title: params.title,
      content: params.content,
      channel: params.channel,
      priority: params.priority || 'normal',
      category: params.category,
      data: params.data,
      metadata: params.metadata,
    });
  }

  async update(id: string, params: Record<string, unknown>) {
    await this.getById(id);
    return this.notificationRepo.update(id, params);
  }

  async markAsSent(id: string) {
    const notification = await this.notificationRepo.markAsSent(id);
    if (!notification) {
      throw new NotificationNotFoundError(id);
    }
    return notification;
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId);
  }

  async findUnreadByUser(userId: string) {
    return this.notificationRepo.findUnreadByUser(userId);
  }

  async findByUser(userId: string, limit?: number) {
    return this.notificationRepo.findByUser(userId, limit);
  }

  async countUnread(userId: string) {
    return this.notificationRepo.countUnread(userId);
  }

  async markAsRead(id: string) {
    return this.notificationRepo.markAsRead(id);
  }

  async markAsReadOwned(id: string, userId: string) {
    const notification = await this.notificationRepo.markAsRead(id);
    if (!notification) {
      throw new NotificationNotFoundError(id);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenError('Unauthorized');
    }
    return notification;
  }

  async deleteOwned(id: string, userId: string) {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) {
      throw new NotificationNotFoundError(id);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenError('Unauthorized');
    }
    const deleted = await this.notificationRepo.delete(id);
    if (!deleted) {
      throw new NotificationNotFoundError(id);
    }
    return { id };
  }
}
