import { NotificationRepo, Notification, NotificationCreateParams } from '../repos/notificationRepo';
import { 
  NotificationBuilder, 
  NotificationChannel 
} from '../domain/notification';

/**
 * Interface for notification delivery providers
 */
interface NotificationDeliveryProvider {
  send(notification: Notification): Promise<boolean>;
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

  async send(notification: Notification): Promise<boolean> {
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

  async send(notification: Notification): Promise<boolean> {
    try {
      // This would be replaced with actual SMS service integration
      console.log(`Sending SMS notification to user ${notification.userId}`);
      // Example: await smsClient.send({
      //  to: getUserPhone(notification.userId),
      //  message: `${notification.title}: ${notification.content.substring(0, 160)}`
      // });
      return true;
    } catch (error) {
      
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

  async send(notification: Notification): Promise<boolean> {
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

  async send(notification: Notification): Promise<boolean> {
    try {
      // In-app notifications are already stored in the database
      // This method would just mark them as available for in-app display
      console.log(`In-app notification ready for user ${notification.userId}`);
      return true;
    } catch (error) {
      
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
  ): Promise<Notification> {
    // Build the notification
    const notificationData = notificationBuilder.build();
    
    // Save to database
    const savedNotification = await this.notificationRepo.create({
      userId: notificationData.userId,
      userType: notificationData.userType,
      type: notificationData.type,
      title: notificationData.title,
      content: notificationData.content,
      channel: Array.isArray(notificationData.channel) ? notificationData.channel[0] : notificationData.channel,
      isRead: false,
      priority: notificationData.priority || 'normal',
      metadata: notificationData.metadata
    });
    
    // Send through appropriate channels
    const channels = Array.isArray(notificationData.channel) ? notificationData.channel : [notificationData.channel];
    const deliveryPromises = channels.map((channel: NotificationChannel) => 
      this.deliverToChannel(savedNotification, channel)
    );
    
    await Promise.all(deliveryPromises);
    
    // Mark as sent
    await this.notificationRepo.markAsSent(savedNotification.notificationId);
    
    return savedNotification;
  }

  /**
   * Send a batch of notifications (useful for marketing campaigns)
   */
  async sendBatchNotifications<T extends Record<string, unknown>>(
    notificationBuilders: NotificationBuilder<T>[]
  ): Promise<Notification[]> {
    const results: Notification[] = [];
    
    for (const builder of notificationBuilders) {
      try {
        const notification = await this.sendNotification(builder);
        results.push(notification);
      } catch (error) {
        
      }
    }
    
    return results;
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await this.notificationRepo.findUnreadByUser(userId);
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await this.notificationRepo.findByUser(userId, limit);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification | null> {
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
    notification: Notification, 
    channel: NotificationChannel
  ): Promise<boolean> {
    const provider = this.deliveryProviders.find(p => p.supportsChannel(channel));
    
    if (!provider) {
      
      return false;
    }
    
    return await provider.send(notification);
  }
}
