import { emitMock, createPauseSubscriptionRepo } from '../../tests/testUtils';
import { PauseSubscriptionUseCase } from './PauseSubscription';
import { SubscriptionNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';

describe('PauseSubscriptionUseCase', () => {
  let useCase: PauseSubscriptionUseCase;
  let subscriptionRepo: ReturnType<typeof createPauseSubscriptionRepo>;

  beforeEach(() => {
    subscriptionRepo = createPauseSubscriptionRepo();
    subscriptionRepo.findById.mockResolvedValue({ status: 'active', customerId: 'cust-1' });
    useCase = new PauseSubscriptionUseCase(subscriptionRepo);
  });

  it('should pause the subscription and emit subscription.paused when it is active', async () => {
    const pauseUntil = new Date('2030-01-01');
    const result = await useCase.execute({ subscriptionId: 'sub-1', reason: 'Vacation', pauseUntil });

    expect(result.status).toBe('paused');
    expect(result.pauseUntil).toBe(pauseUntil);
    expect(subscriptionRepo.update).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ status: 'paused', pauseReason: 'Vacation', pauseUntil }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'subscription.paused',
      expect.objectContaining({ subscriptionId: 'sub-1', customerId: 'cust-1', reason: 'Vacation' }),
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

  it('should throw SubscriptionValidationError when the subscription is not active', async () => {
    subscriptionRepo.findById.mockResolvedValue({ status: 'paused', customerId: 'cust-1' });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
    expect(subscriptionRepo.update).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
