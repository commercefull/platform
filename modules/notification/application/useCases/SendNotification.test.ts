/**
 * Unit Tests for SendNotification Use Case
 */

import { SendNotificationUseCase } from './SendNotification';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    mockService = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SendNotificationUseCase(
      mockRepo as never as ConstructorParameters<typeof SendNotificationUseCase>[0],
      mockService as never as ConstructorParameters<typeof SendNotificationUseCase>[1],
    );
  });

  it('should send notification immediately when not scheduled', async () => {
    const result = await useCase.execute({
      recipientId: 'cust-1',
      recipientType: 'customer',
      channel: 'email',
      content: 'Welcome!',
      subject: 'Welcome',
    });

    expect(result.status).toBe('sent');
    expect(result.sentAt).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: 'cust-1',
      channel: 'email',
      status: 'pending',
    }));
    expect(mockService.send).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'email',
      recipientId: 'cust-1',
      content: 'Welcome!',
    }));
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(expect.any(String), 'sent');
  });

  it('should queue notification when scheduledAt is provided', async () => {
    const scheduledAt = new Date(Date.now() + 3600000);

    const result = await useCase.execute({
      recipientId: 'cust-1',
      recipientType: 'customer',
      channel: 'email',
      content: 'Reminder',
      scheduledAt,
    });

    expect(result.status).toBe('queued');
    expect(mockService.send).not.toHaveBeenCalled();
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'scheduled',
    }));
  });

  it('should return failed status when service throws', async () => {
    mockService.send.mockRejectedValue(new Error('SMTP error'));

    const result = await useCase.execute({
      recipientId: 'cust-1',
      recipientType: 'customer',
      channel: 'email',
      content: 'Test',
    });

    expect(result.status).toBe('failed');
    expect(result.error).toBe('SMTP error');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(expect.any(String), 'failed', 'SMTP error');
  });

  it('should throw NotificationValidationError when recipientId is missing', async () => {
    await expect(
      useCase.execute({
        recipientId: '',
        recipientType: 'customer',
        channel: 'email',
        content: 'Test',
      }),
    ).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when channel is missing', async () => {
    await expect(
      useCase.execute({
        recipientId: 'cust-1',
        recipientType: 'customer',
        channel: '' as never as 'email',
        content: 'Test',
      }),
    ).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when content is missing', async () => {
    await expect(
      useCase.execute({
        recipientId: 'cust-1',
        recipientType: 'customer',
        channel: 'email',
        content: '',
      }),
    ).rejects.toThrow(NotificationValidationError);
  });

  it('should default priority to normal', async () => {
    await useCase.execute({
      recipientId: 'cust-1',
      recipientType: 'customer',
      channel: 'email',
      content: 'Test',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      priority: 'normal',
    }));
  });
});
