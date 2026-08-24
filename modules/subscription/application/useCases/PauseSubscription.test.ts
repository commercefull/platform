jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { PauseSubscriptionUseCase} from './PauseSubscription';
import { SubscriptionNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('PauseSubscriptionUseCase', () => {
  let useCase: PauseSubscriptionUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ status: 'active', customerId: 'c1' }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new PauseSubscriptionUseCase(mockRepo as never);
  });

  it('should pause an active subscription (happy path)', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1', reason: 'Vacation' });

    expect(result.subscriptionId).toBe('sub-1');
    expect(result.status).toBe('paused');
    expect(eventBus.emit).toHaveBeenCalledWith('subscription.paused', expect.objectContaining({ subscriptionId: 'sub-1', reason: 'Vacation' }));
  });

  it('should throw SubscriptionValidationError when id is empty', async () => {
    await expect(useCase.execute({ subscriptionId: '' })).rejects.toThrow(SubscriptionValidationError);
  });

  it('should throw SubscriptionNotFoundError when subscription does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'missing' })).rejects.toThrow(SubscriptionNotFoundError);
  });

  it('should throw SubscriptionValidationError when subscription is not active', async () => {
    mockRepo.findById.mockResolvedValue({ status: 'paused', customerId: 'c1' });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
  });
});
