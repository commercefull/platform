/**
 * Base notification type that all specific notifications will extend
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

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface BaseNotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  channel: NotificationChannel[];
  isRead: boolean;
  createdAt: string;
  sentAt?: string;
  metadata?: Record<string, unknown>;
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
  protected type!: NotificationType;  // Using definite assignment assertion
  protected title!: string;           // Using definite assignment assertion
  protected content!: string;         // Using definite assignment assertion
  protected channel: NotificationChannel[];
  protected metadata?: Record<string, unknown>;
  
  constructor(userId: string, channels: NotificationChannel[] = ['email']) {
    this.userId = userId;
    this.channel = channels;
  }

  abstract buildTitle(): string;
  abstract buildContent(): string;
  abstract getMetadata(): Record<string, unknown> | undefined;
  
  build(): BaseNotification {
    return {
      userId: this.userId,
      type: this.type,
      title: this.buildTitle(),
      content: this.buildContent(),
      channel: this.channel,
      isRead: false,
      createdAt: formatDate(),
      metadata: this.getMetadata()
    };
  }
}
