import { createStorefrontNotificationPort } from '../../tests/testUtils';
import { ManageStorefrontNotificationsUseCase } from './ManageStorefrontNotifications';

describe('ManageStorefrontNotificationsUseCase', () => {
  let useCase: ManageStorefrontNotificationsUseCase;
  let port: ReturnType<typeof createStorefrontNotificationPort>;

  beforeEach(() => {
    port = createStorefrontNotificationPort();
    useCase = new ManageStorefrontNotificationsUseCase(port);
  });

  it('should count notifications for the user', async () => {
    port.countByUserId.mockResolvedValue(7);

    const result = await useCase.countByUserId('u-1');

    expect(result).toBe(7);
    expect(port.countByUserId).toHaveBeenCalledWith('u-1');
  });

  it('should page through the notification feed', async () => {
    port.findByUserId.mockResolvedValue([{ notificationId: 'n-1' }]);

    const result = await useCase.findByUserId('u-1', 20, 40);

    expect(result).toHaveLength(1);
    expect(port.findByUserId).toHaveBeenCalledWith('u-1', 20, 40);
  });

  it('should count unread notifications', async () => {
    port.countUnreadByUserId.mockResolvedValue(3);

    const result = await useCase.countUnreadByUserId('u-1');

    expect(result).toBe(3);
  });

  it('should mark a single notification as read', async () => {
    port.markAsRead.mockResolvedValue(undefined);

    await useCase.markAsRead('n-1', 'u-1');

    expect(port.markAsRead).toHaveBeenCalledWith('n-1', 'u-1');
  });

  it('should mark all notifications as read', async () => {
    port.markAllAsRead.mockResolvedValue(undefined);

    await useCase.markAllAsRead('u-1');

    expect(port.markAllAsRead).toHaveBeenCalledWith('u-1');
  });

  it('should return null when the user has no preferences', async () => {
    port.getPreferences.mockResolvedValue(null);

    const result = await useCase.getPreferences('u-1');

    expect(result).toBeNull();
  });

  it('should upsert notification preferences', async () => {
    port.upsertPreferences.mockResolvedValue(undefined);
    const prefs = {
      emailOrderUpdates: true,
      emailPromotions: false,
      emailNewsletter: false,
      pushEnabled: true,
    };

    await useCase.upsertPreferences('u-1', prefs);

    expect(port.upsertPreferences).toHaveBeenCalledWith('u-1', prefs);
  });
});
