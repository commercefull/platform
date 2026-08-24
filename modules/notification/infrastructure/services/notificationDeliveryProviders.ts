/**
 * Notification Delivery Providers
 *
 * Infrastructure adapters for sending notifications through various channels.
 * Each provider implements the NotificationDeliveryProvider interface.
 */

import { logger } from '../../../../libs/logger';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface NotificationDeliveryPayload {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationDeliveryProvider {
  send(notification: NotificationDeliveryPayload): Promise<boolean>;
  supportsChannel(channel: NotificationChannel): boolean;
}

export class EmailDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'email';
  }

  async send(_notification: NotificationDeliveryPayload): Promise<boolean> {
    return true;
  }
}

export class SmsDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'sms';
  }

  async send(_notification: NotificationDeliveryPayload): Promise<boolean> {
    return true;
  }
}

export class PushDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'push';
  }

  async send(_notification: NotificationDeliveryPayload): Promise<boolean> {
    return true;
  }
}

export class InAppDeliveryProvider implements NotificationDeliveryProvider {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === 'in_app';
  }

  async send(_notification: NotificationDeliveryPayload): Promise<boolean> {
    return true;
  }
}

export class NotificationDeliveryService {
  private providers: NotificationDeliveryProvider[];

  constructor(providers?: NotificationDeliveryProvider[]) {
    this.providers = providers || [
      new EmailDeliveryProvider(),
      new SmsDeliveryProvider(),
      new PushDeliveryProvider(),
      new InAppDeliveryProvider(),
    ];
  }

  async deliver(notification: NotificationDeliveryPayload, channels: NotificationChannel[]): Promise<boolean[]> {
    const results: boolean[] = [];
    for (const channel of channels) {
      const provider = this.providers.find(p => p.supportsChannel(channel));
      if (!provider) {
        logger.warn(`No delivery provider for channel: ${channel}`);
        results.push(false);
        continue;
      }
      results.push(await provider.send(notification));
    }
    return results;
  }
}
