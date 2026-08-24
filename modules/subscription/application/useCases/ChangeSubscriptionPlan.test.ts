jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ChangeSubscriptionPlanUseCase} from './ChangeSubscriptionPlan';
import { SubscriptionNotFoundError, SubscriptionPlanNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ChangeSubscriptionPlanUseCase', () => {
  let useCase: ChangeSubscriptionPlanUseCase;
  let mockSubRepo: Record<string, jest.Mock>;
  let mockPlanRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockSubRepo = {
      findById: jest.fn().mockResolvedValue({ status: 'active', planId: 'old-plan', customerId: 'c1', nextBillingDate: new Date(Date.now() + 86400000).toISOString(), price: 10 }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockPlanRepo = { findById: jest.fn().mockResolvedValue({ price: 20 }) };
    useCase = new ChangeSubscriptionPlanUseCase(mockSubRepo as never, mockPlanRepo as never);
  });

  it('should change subscription plan (happy path)', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'new-plan', applyImmediately: true });

    expect(result.subscriptionId).toBe('sub-1');
    expect(result.previousPlanId).toBe('old-plan');
    expect(result.newPlanId).toBe('new-plan');
    expect(eventBus.emit).toHaveBeenCalledWith('subscription.activated', expect.objectContaining({ action: 'plan_changed' }));
  });

  it('should throw SubscriptionValidationError when ids are missing', async () => {
    await expect(useCase.execute({ subscriptionId: '', newPlanId: 'p' })).rejects.toThrow(SubscriptionValidationError);
  });

  it('should throw SubscriptionNotFoundError when subscription does not exist', async () => {
    mockSubRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'missing', newPlanId: 'p' })).rejects.toThrow(SubscriptionNotFoundError);
  });

  it('should throw SubscriptionPlanNotFoundError when plan does not exist', async () => {
    mockPlanRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'missing' })).rejects.toThrow(SubscriptionPlanNotFoundError);
  });

  it('should throw SubscriptionValidationError for inactive subscription', async () => {
    mockSubRepo.findById.mockResolvedValue({ status: 'canceled', planId: 'old', customerId: 'c1', nextBillingDate: new Date().toISOString() });

    await expect(useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'p' })).rejects.toThrow(SubscriptionValidationError);
  });
});
