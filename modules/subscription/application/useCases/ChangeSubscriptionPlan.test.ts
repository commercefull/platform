import { emitMock, createChangePlanPorts } from '../../tests/testUtils';
import { ChangeSubscriptionPlanUseCase } from './ChangeSubscriptionPlan';
import {
  SubscriptionNotFoundError,
  SubscriptionPlanNotFoundError,
  SubscriptionValidationError,
} from '../../domain/errors/SubscriptionErrors';

describe('ChangeSubscriptionPlanUseCase', () => {
  let useCase: ChangeSubscriptionPlanUseCase;
  let ports: ReturnType<typeof createChangePlanPorts>;

  const subscription = {
    status: 'active',
    planId: 'plan-1',
    customerId: 'cust-1',
    nextBillingDate: '2030-01-01',
    priceCents: 2999,
  };

  beforeEach(() => {
    ports = createChangePlanPorts();
    ports.subscriptionRepo.findById.mockResolvedValue(subscription);
    ports.planRepo.findById.mockResolvedValue({ priceCents: 4999 });
    useCase = new ChangeSubscriptionPlanUseCase(ports.subscriptionRepo, ports.planRepo);
  });

  it('should switch the plan and emit subscription.activated when both exist', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'plan-2' });

    expect(result.previousPlanId).toBe('plan-1');
    expect(result.newPlanId).toBe('plan-2');
    expect(ports.subscriptionRepo.update).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ planId: 'plan-2', previousPlanId: 'plan-1' }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'subscription.activated',
      expect.objectContaining({ subscriptionId: 'sub-1', previousPlanId: 'plan-1', newPlanId: 'plan-2', action: 'plan_changed' }),
    );
  });

  it('should apply the change at the next billing date when applyImmediately is not set', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'plan-2' });

    expect(result.effectiveDate).toEqual(new Date('2030-01-01'));
    expect(result.proratedAmountCents).toBeUndefined();
  });

  it('should calculate a prorated amount when applyImmediately and prorateCharges are set', async () => {
    ports.subscriptionRepo.findById.mockResolvedValue({
      ...subscription,
      currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
      nextBillingDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    });

    const result = await useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'plan-2', applyImmediately: true, prorateCharges: true });

    expect(result.proratedAmountCents).toBeGreaterThan(0); // upgrading 29.99 → 49.99 mid-period
    expect(result.effectiveDate).toBeInstanceOf(Date);
  });

  it('should throw SubscriptionValidationError when required ids are missing', async () => {
    await expect(useCase.execute({ subscriptionId: '', newPlanId: 'plan-2' })).rejects.toThrow(SubscriptionValidationError);
    await expect(useCase.execute({ subscriptionId: 'sub-1', newPlanId: '' })).rejects.toThrow(SubscriptionValidationError);
    expect(ports.subscriptionRepo.update).not.toHaveBeenCalled();
  });

  it('should throw SubscriptionNotFoundError when the subscription does not exist', async () => {
    ports.subscriptionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'missing', newPlanId: 'plan-2' })).rejects.toThrow(
      SubscriptionNotFoundError,
    );
  });

  it('should throw SubscriptionPlanNotFoundError when the new plan does not exist', async () => {
    ports.planRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'missing' })).rejects.toThrow(
      SubscriptionPlanNotFoundError,
    );
    expect(ports.subscriptionRepo.update).not.toHaveBeenCalled();
  });

  it('should throw SubscriptionValidationError when the subscription is inactive', async () => {
    ports.subscriptionRepo.findById.mockResolvedValue({ ...subscription, status: 'cancelled' });

    await expect(useCase.execute({ subscriptionId: 'sub-1', newPlanId: 'plan-2' })).rejects.toThrow(
      SubscriptionValidationError,
    );
    expect(emitMock).not.toHaveBeenCalled();
  });
});
