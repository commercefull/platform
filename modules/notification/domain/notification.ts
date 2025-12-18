/**
 * Base notification type that all specific notifications will extend
 * These values are stored in the database as enum values, so we keep them in snake_case
 */
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

/**
 * Database enum values are kept in snake_case
 */
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationUserType = 'customer' | 'merchant' | 'admin';

/**
 * BaseNotification interface representing the TypeScript model for notifications
 * Uses camelCase property names according to platform standards
 */
export interface BaseNotification {
  id?: string;
  userId: string;
  userType: NotificationUserType;
  type: NotificationType;
  title: string;
  content: string;
  channel: NotificationChannel | NotificationChannel[];
  isRead: boolean;
  readAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  priority?: NotificationPriority;
  category?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Helper function to format date strings consistently
 */
export const formatDate = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Abstract base class for creating notification payloads
 */
export abstract class NotificationBuilder<T> {
  protected userId: string;
  protected userType: NotificationUserType;
  protected type!: NotificationType;  // Using definite assignment assertion
  protected title!: string;           // Using definite assignment assertion
  protected content!: string;         // Using definite assignment assertion
  protected channel: NotificationChannel[];
  protected priority: NotificationPriority;
  protected metadata?: Record<string, unknown>;
  
  constructor(
    userId: string, 
    userType: NotificationUserType = 'customer',
    channels: NotificationChannel[] = ['email'],
    priority: NotificationPriority = 'normal'
  ) {
    this.userId = userId;
    this.userType = userType;
    this.channel = channels;
    this.priority = priority;
  }

  abstract buildTitle(): string;
  abstract buildContent(): string;
  abstract getMetadata(): Record<string, unknown> | undefined;
  
  build(): BaseNotification {
    return {
      userId: this.userId,
      userType: this.userType,
      type: this.type,
      title: this.buildTitle(),
      content: this.buildContent(),
      channel: this.channel,
      isRead: false,
      priority: this.priority,
      createdAt: formatDate(),
      metadata: this.getMetadata()
    };
  }
}
