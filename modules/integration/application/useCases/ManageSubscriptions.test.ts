import '../../tests/testUtils';
import { ManageSubscriptionsUseCase } from './ManageSubscriptions';
import { IntegrationNotFoundError, SubscriptionNotFoundError } from '../../domain/errors/IntegrationErrors';
import type {
  IntegrationRepository, IntegrationSubscriptionRepository,
} from '../../domain/repositories/IntegrationRepository';
import { createIntegration, createSubscription, lazyMock } from '../../tests/testUtils';

describe('ManageSubscriptionsUseCase', () => {
  let subscriptionRepo: jest.Mocked<IntegrationSubscriptionRepository>;
  let integrationRepo: jest.Mocked<IntegrationRepository>;
  let useCase: ManageSubscriptionsUseCase;

  beforeEach(() => {
    subscriptionRepo = lazyMock<IntegrationSubscriptionRepository>();
    integrationRepo = lazyMock<IntegrationRepository>();
    subscriptionRepo.create.mockImplementation(async s => s);
    subscriptionRepo.update.mockImplementation(async s => s);
    useCase = new ManageSubscriptionsUseCase(subscriptionRepo, integrationRepo);
  });

  it('should create a subscription when the integration exists', async () => {
    integrationRepo.findById.mockResolvedValue(createIntegration());

    const result = await useCase.createSubscription({
      integrationId: 'int-1', eventType: 'order.created', targetAction: 'https://x.test',
    });

    expect(result.isActive).toBe(true);
    expect(subscriptionRepo.create).toHaveBeenCalled();
  });

  it('should throw IntegrationNotFoundError when subscribing a missing integration', async () => {
    integrationRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.createSubscription({ integrationId: 'missing', eventType: 'x', targetAction: 'y' }),
    ).rejects.toThrow(IntegrationNotFoundError);
  });

  it('should deactivate a subscription when isActive is false', async () => {
    subscriptionRepo.findById.mockResolvedValue(createSubscription());

    const result = await useCase.updateSubscription('sub-1', { isActive: false });

    expect(result.isActive).toBe(false);
  });

  it('should throw SubscriptionNotFoundError when the subscription does not exist', async () => {
    subscriptionRepo.findById.mockResolvedValue(null);

    await expect(useCase.getSubscription('missing')).rejects.toThrow(SubscriptionNotFoundError);
  });
});

