jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ResumeSubscriptionUseCase} from './ResumeSubscription';
import { SubscriptionNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ResumeSubscriptionUseCase', () => {
  let useCase: ResumeSubscriptionUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ status: 'paused', customerId: 'c1', billingInterval: 'monthly' }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ResumeSubscriptionUseCase(mockRepo as never);
  });

  it('should resume a paused subscription (happy path)', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1' });

    expect(result.subscriptionId).toBe('sub-1');
    expect(result.status).toBe('active');
    expect(eventBus.emit).toHaveBeenCalledWith('subscription.resumed', expect.objectContaining({ subscriptionId: 'sub-1' }));
  });

  it('should throw SubscriptionValidationError when id is empty', async () => {
    await expect(useCase.execute({ subscriptionId: '' })).rejects.toThrow(SubscriptionValidationError);
  });

  it('should throw SubscriptionNotFoundError when subscription does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'missing' })).rejects.toThrow(SubscriptionNotFoundError);
  });

  it('should throw SubscriptionValidationError when subscription is not paused', async () => {
    mockRepo.findById.mockResolvedValue({ status: 'active', customerId: 'c1' });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
  });
});
