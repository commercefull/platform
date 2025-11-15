import { NotificationRepo } from '../repos/notificationRepo';
import { 
  BaseNotification, 
  NotificationBuilder, 
  NotificationChannel 
} from '../domain/notification';

/**
 * Interface for notification delivery providers
 */
interface NotificationDeliveryProvider {
  send(notification: BaseNotification): Promise<boolean>;
  supportsChannel(channel: NotificationChannel): boolean;
}

/**
 * Email delivery provider
 * This would integrate with your actual email service (SendGrid, Mailchimp, etc.)
 */
class EmailDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'email';
  }

  async send(notification: BaseNotification): Promise<boolean> {
    try {
      // This would be replaced with actual email service integration
      console.log(`Sending email notification: ${notification.title} to user ${notification.userId}`);
      // Example: await emailClient.send({
      //  to: getUserEmail(notification.userId),
      //  subject: notification.title,
      //  body: notification.content
      // });
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }
}

/**
 * SMS delivery provider
 * This would integrate with your actual SMS service (Twilio, etc.)
 */
class SmsDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'sms';
  }

  async send(notification: BaseNotification): Promise<boolean> {
    try {
      // This would be replaced with actual SMS service integration
      console.log(`Sending SMS notification to user ${notification.userId}`);
      // Example: await smsClient.send({
      //  to: getUserPhone(notification.userId),
      //  message: `${notification.title}: ${notification.content.substring(0, 160)}`
      // });
      return true;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      return false;
    }
  }
}

/**
 * Push notification delivery provider
 * This would integrate with your actual push notification service (Firebase, etc.)
 */
class PushDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'push';
  }

  async send(notification: BaseNotification): Promise<boolean> {
    try {
      // This would be replaced with actual push notification service integration
      console.log(`Sending push notification to user ${notification.userId}`);
      // Example: await pushClient.send({
      //  userId: notification.userId,
      //  title: notification.title,
      //  body: notification.content.substring(0, 200),
      //  data: notification.metadata
      // });
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }
}

/**
 * In-app notification delivery provider
 * This stores notifications for display within the application
 */
class InAppDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'in_app';
  }

  async send(notification: BaseNotification): Promise<boolean> {
    try {
      // In-app notifications are already stored in the database
      // This method would just mark them as available for in-app display
      console.log(`In-app notification ready for user ${notification.userId}`);
      return true;
    } catch (error) {
      console.error('Failed to prepare in-app notification:', error);
      return false;
    }
  }
}

/**
 * Main notification service
 */
export class NotificationService {
  private notificationRepo: NotificationRepo;
  private deliveryProviders: NotificationDeliveryProvider[];

  constructor() {
    this.notificationRepo = new NotificationRepo();
    
    // Register delivery providers
    this.deliveryProviders = [
      new EmailDeliveryProvider(),
      new SmsDeliveryProvider(),
      new PushDeliveryProvider(),
      new InAppDeliveryProvider()
    ];
  }

  /**
   * Create and send a notification
   */
  async sendNotification<T extends Record<string, unknown>>(
    notificationBuilder: NotificationBuilder<T>
  ): Promise<BaseNotification> {
    // Build the notification
    const notification = notificationBuilder.build();
    
    // Save to database
    const savedNotification = await this.notificationRepo.create(notification);
    
    // Send through appropriate channels
    const channels = Array.isArray(notification.channel) ? notification.channel : [notification.channel];
    const deliveryPromises = channels.map((channel: NotificationChannel) => 
      this.deliverToChannel(savedNotification, channel)
    );
    
    await Promise.all(deliveryPromises);
    
    // Mark as sent
    if (savedNotification.id) {
      await this.notificationRepo.markAsSent(savedNotification.id);
    }
    
    return savedNotification;
  }

  /**
   * Send a batch of notifications (useful for marketing campaigns)
   */
  async sendBatchNotifications<T extends Record<string, unknown>>(
    notificationBuilders: NotificationBuilder<T>[]
  ): Promise<BaseNotification[]> {
    const results: BaseNotification[] = [];
    
    for (const builder of notificationBuilders) {
      try {
        const notification = await this.sendNotification(builder);
        results.push(notification);
      } catch (error) {
        console.error('Failed to send notification in batch:', error);
      }
    }
    
    return results;
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<BaseNotification[] | null> {
    return await this.notificationRepo.findUnreadByUser(userId);
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(userId: string, limit: number = 50): Promise<BaseNotification[] | null> {
    return await this.notificationRepo.findByUser(userId, limit);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<BaseNotification | null> {
    return await this.notificationRepo.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    return await this.notificationRepo.markAllAsRead(userId);
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepo.countUnread(userId);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    return await this.notificationRepo.delete(notificationId);
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    return await this.notificationRepo.deleteAllForUser(userId);
  }

  /**
   * Deliver a notification through a specific channel
   */
  private async deliverToChannel(
    notification: BaseNotification, 
    channel: NotificationChannel
  ): Promise<boolean> {
    const provider = this.deliveryProviders.find(p => p.supportsChannel(channel));
    
    if (!provider) {
      console.error(`No provider found for channel: ${channel}`);
      return false;
    }
    
    return await provider.send(notification);
  }
}
