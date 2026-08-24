/**
 * Unit Tests for Notification Entity
 */

import { Notification } from './Notification';

describe('Notification', () => {
  describe('create', () => {
    it('should create a notification with pending status', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'email',
        channel: 'email',
        content: 'Hello world',
      });

      expect(n.notificationId).toBe('ntf-1');
      expect(n.recipientId).toBe('cust-1');
      expect(n.type).toBe('email');
      expect(n.status).toBe('pending');
      expect(n.content).toBe('Hello world');
      expect(n.createdAt).toBeDefined();
    });

    it('should create with optional fields', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'sms',
        channel: 'sms',
        content: 'Code: 1234',
        subject: 'Verification',
        templateId: 'tpl-1',
        recipientEmail: 'user@example.com',
        recipientPhone: '555-1234',
        data: { code: '1234' },
        scheduledFor: new Date('2024-12-01'),
        metadata: { source: 'test' },
      });

      expect(n.type).toBe('sms');
      expect(n.content).toBe('Code: 1234');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const n = Notification.reconstitute({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'push',
        channel: 'push',
        content: 'Push message',
        status: 'sent',
        retryCount: 2,
        sentAt: new Date('2024-06-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
      });

      expect(n.status).toBe('sent');
      expect(n.notificationId).toBe('ntf-1');
    });
  });

  describe('markAsSent', () => {
    it('should set status to sent and set sentAt', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'email',
        channel: 'email',
        content: 'Test',
      });

      n.markAsSent();

      expect(n.status).toBe('sent');
    });
  });

  describe('markAsDelivered', () => {
    it('should set status to delivered', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'email',
        channel: 'email',
        content: 'Test',
      });

      n.markAsDelivered();

      expect(n.status).toBe('delivered');
    });
  });

  describe('markAsRead', () => {
    it('should set status to read', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'in_app',
        channel: 'in_app',
        content: 'Test',
      });

      n.markAsRead();

      expect(n.status).toBe('read');
    });
  });

  describe('markAsFailed', () => {
    it('should set status to failed and increment retryCount', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'email',
        channel: 'email',
        content: 'Test',
      });

      n.markAsFailed('SMTP timeout');

      expect(n.status).toBe('failed');
      expect(n.toJSON().errorMessage).toBe('SMTP timeout');
      expect(n.toJSON().retryCount).toBe(1);
    });

    it('should increment retryCount on each failure', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'email',
        channel: 'email',
        content: 'Test',
      });

      n.markAsFailed('error 1');
      n.markAsFailed('error 2');

      expect(n.toJSON().retryCount).toBe(2);
    });
  });

  describe('toJSON', () => {
    it('should return all props as plain object', () => {
      const n = Notification.create({
        notificationId: 'ntf-1',
        recipientId: 'cust-1',
        type: 'email',
        channel: 'email',
        content: 'Test',
        subject: 'Subject',
      });

      const json = n.toJSON();

      expect(json.notificationId).toBe('ntf-1');
      expect(json.recipientId).toBe('cust-1');
      expect(json.content).toBe('Test');
      expect(json.subject).toBe('Subject');
      expect(json.status).toBe('pending');
    });
  });
});
