/**
 * Unit Tests for MarkAsRead Use Case
 */

import { MarkAsReadUseCase } from './MarkAsRead';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('MarkAsReadUseCase', () => {
  let useCase: MarkAsReadUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      markAsRead: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new MarkAsReadUseCase(mockRepo as never as ConstructorParameters<typeof MarkAsReadUseCase>[0]);
  });

  it('should mark unread notifications as read', async () => {
    mockRepo.findById
      .mockResolvedValueOnce({ notificationId: 'ntf-1', recipientId: 'cust-1', isRead: false })
      .mockResolvedValueOnce({ notificationId: 'ntf-2', recipientId: 'cust-1', isRead: false });

    const result = await useCase.execute({
      notificationIds: ['ntf-1', 'ntf-2'],
      recipientId: 'cust-1',
    });

    expect(result.markedCount).toBe(2);
    expect(mockRepo.markAsRead).toHaveBeenCalledTimes(2);
  });

  it('should skip already-read notifications', async () => {
    mockRepo.findById
      .mockResolvedValueOnce({ notificationId: 'ntf-1', recipientId: 'cust-1', isRead: true })
      .mockResolvedValueOnce({ notificationId: 'ntf-2', recipientId: 'cust-1', isRead: false });

    const result = await useCase.execute({
      notificationIds: ['ntf-1', 'ntf-2'],
      recipientId: 'cust-1',
    });

    expect(result.markedCount).toBe(1);
    expect(mockRepo.markAsRead).toHaveBeenCalledTimes(1);
    expect(mockRepo.markAsRead).toHaveBeenCalledWith('ntf-2', expect.any(Date));
  });

  it('should skip notifications not owned by recipient', async () => {
    mockRepo.findById.mockResolvedValue({ notificationId: 'ntf-1', recipientId: 'other-user', isRead: false });

    const result = await useCase.execute({
      notificationIds: ['ntf-1'],
      recipientId: 'cust-1',
    });

    expect(result.markedCount).toBe(0);
    expect(mockRepo.markAsRead).not.toHaveBeenCalled();
  });

  it('should match by userId field as well', async () => {
    mockRepo.findById.mockResolvedValue({ notificationId: 'ntf-1', userId: 'cust-1', isRead: false });

    const result = await useCase.execute({
      notificationIds: ['ntf-1'],
      recipientId: 'cust-1',
    });

    expect(result.markedCount).toBe(1);
  });

  it('should skip when notification not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      notificationIds: ['ntf-x'],
      recipientId: 'cust-1',
    });

    expect(result.markedCount).toBe(0);
  });

  it('should throw when notificationIds is empty', async () => {
    await expect(
      useCase.execute({ notificationIds: [], recipientId: 'cust-1' }),
    ).rejects.toThrow(NotificationValidationError);
  });

  it('should return markedAt timestamp', async () => {
    mockRepo.findById.mockResolvedValue({ notificationId: 'ntf-1', recipientId: 'cust-1', isRead: false });

    const result = await useCase.execute({
      notificationIds: ['ntf-1'],
      recipientId: 'cust-1',
    });

    expect(result.markedAt).toBeDefined();
    expect(new Date(result.markedAt).toISOString()).toBe(result.markedAt);
  });
});
