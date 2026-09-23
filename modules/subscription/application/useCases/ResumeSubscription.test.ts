import { emitMock, createResumeSubscriptionRepo } from '../../tests/testUtils';
import { ResumeSubscriptionUseCase } from './ResumeSubscription';
import { SubscriptionNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';

describe('ResumeSubscriptionUseCase', () => {
  let useCase: ResumeSubscriptionUseCase;
  let subscriptionRepo: ReturnType<typeof createResumeSubscriptionRepo>;

  beforeEach(() => {
    subscriptionRepo = createResumeSubscriptionRepo();
    subscriptionRepo.findById.mockResolvedValue({ status: 'paused', customerId: 'cust-1', billingInterval: 'monthly' });
    useCase = new ResumeSubscriptionUseCase(subscriptionRepo);
  });

  it('should resume the subscription and emit subscription.resumed when it is paused', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1' });

    expect(result.status).toBe('active');
    expect(result.nextBillingDate).toBeInstanceOf(Date);
    expect(subscriptionRepo.update).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ status: 'active', pausedAt: null, pauseReason: null, pauseUntil: null }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'subscription.resumed',
      expect.objectContaining({ subscriptionId: 'sub-1', customerId: 'cust-1' }),
    );
  });

  it('should throw SubscriptionValidationError when the subscription ID is empty', async () => {
    await expect(useCase.execute({ subscriptionId: '' })).rejects.toThrow(SubscriptionValidationError);
    expect(subscriptionRepo.update).not.toHaveBeenCalled();
  });

  it('should throw SubscriptionNotFoundError when the subscription does not exist', async () => {
    subscriptionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'missing' })).rejects.toThrow(SubscriptionNotFoundError);
    expect(subscriptionRepo.update).not.toHaveBeenCalled();
  });

  it('should throw SubscriptionValidationError when the subscription is not paused', async () => {
    subscriptionRepo.findById.mockResolvedValue({ status: 'active', customerId: 'cust-1' });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
    expect(subscriptionRepo.update).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
