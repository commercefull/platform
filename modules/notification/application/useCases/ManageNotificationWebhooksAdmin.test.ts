jest.mock('../../infrastructure/repositories/NotificationConfigRepository', () => ({
  __esModule: true,
  default: {
    webhooks: {
      findAll: jest.fn().mockResolvedValue([{ notificationWebhookId: 'w1' }]),
      create: jest.fn().mockResolvedValue({ notificationWebhookId: 'w2', url: 'https://example.com' }),
      deactivate: jest.fn().mockResolvedValue(true),
    },
    templates: {},
    preferences: {},
    devices: {},
    templateTranslations: {},
  },
}));

import { ManageNotificationWebhooksAdminUseCase } from './ManageNotificationWebhooksAdmin';

describe('ManageNotificationWebhooksAdminUseCase', () => {
  let useCase: ManageNotificationWebhooksAdminUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageNotificationWebhooksAdminUseCase();
  });

  it('should find all webhooks', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should create webhook', async () => {
    const result = await useCase.create({ url: 'https://example.com', events: ['order.created'] } as never);
    expect(result).toEqual({ notificationWebhookId: 'w2', url: 'https://example.com' });
  });

  it('should deactivate webhook', async () => {
    const result = await useCase.deactivate('w1');
    expect(result).toBe(true);
  });
});
