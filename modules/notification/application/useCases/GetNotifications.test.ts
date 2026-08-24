/**
 * Unit Tests for GetNotifications Use Case
 */

import { GetNotificationsUseCase } from './GetNotifications';

describe('GetNotificationsUseCase', () => {
  let useCase: GetNotificationsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      countUnread: jest.fn(),
    };
    useCase = new GetNotificationsUseCase(mockRepo as never as ConstructorParameters<typeof GetNotificationsUseCase>[0]);
  });

  it('should return notifications with default pagination', async () => {
    mockRepo.findAll.mockResolvedValue([
      {
        notificationId: 'ntf-1',
        channel: 'email',
        subject: 'Welcome',
        content: 'Hello',
        status: 'sent',
        isRead: false,
        createdAt: new Date('2024-06-01'),
      },
    ]);
    mockRepo.countUnread.mockResolvedValue(1);

    const result = await useCase.execute({ recipientId: 'cust-1' });

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].notificationId).toBe('ntf-1');
    expect(result.notifications[0].status).toBe('sent');
    expect(result.total).toBe(1);
    expect(result.unreadCount).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should pass filters to repository', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    mockRepo.countUnread.mockResolvedValue(0);

    await useCase.execute({
      recipientId: 'cust-1',
      recipientType: 'customer',
      channel: 'email',
      status: 'sent',
      unreadOnly: true,
      page: 2,
      limit: 50,
    });

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'cust-1',
        recipientType: 'customer',
        channel: 'email',
        status: 'sent',
        isRead: false,
      }),
      { page: 2, limit: 50 },
    );
  });

  it('should use default page and limit when not provided', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    mockRepo.countUnread.mockResolvedValue(0);

    const result = await useCase.execute({ recipientId: 'cust-1' });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should default status to pending when not set in record', async () => {
    mockRepo.findAll.mockResolvedValue([
      {
        notificationId: 'ntf-1',
        channel: 'email',
        content: 'Hello',
        isRead: false,
        createdAt: new Date('2024-06-01'),
      },
    ]);
    mockRepo.countUnread.mockResolvedValue(0);

    const result = await useCase.execute({ recipientId: 'cust-1' });

    expect(result.notifications[0].status).toBe('pending');
  });

  it('should format readAt as ISO string', async () => {
    const readAt = new Date('2024-06-02');
    mockRepo.findAll.mockResolvedValue([
      {
        notificationId: 'ntf-1',
        channel: 'email',
        content: 'Hello',
        status: 'read',
        isRead: true,
        createdAt: new Date('2024-06-01'),
        readAt,
      },
    ]);
    mockRepo.countUnread.mockResolvedValue(0);

    const result = await useCase.execute({ recipientId: 'cust-1' });

    expect(result.notifications[0].readAt).toBe(readAt.toISOString());
  });
});
