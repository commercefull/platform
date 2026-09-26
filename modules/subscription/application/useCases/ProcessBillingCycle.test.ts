import { ProcessBillingCycleUseCase, type ProcessBillingCyclePort } from './ProcessBillingCycle';
import { SubscriptionNotFoundError } from '../../domain/errors/SubscriptionErrors';
import { createSubscriptionRepository, createCustomerSubscription } from '../../tests/testUtils';
const makePort = (): jest.Mocked<ProcessBillingCyclePort> =>
  createSubscriptionRepository() as unknown as jest.Mocked<ProcessBillingCyclePort>;

describe('ProcessBillingCycleUseCase', () => {
  it('should create the next-cycle order and advance the billing cycle', async () => {
    const port = makePort();
    const periodEnd = new Date('2025-02-01');
    const subscription = createCustomerSubscription({
      customerSubscriptionId: 'sub-1',
      billingCycleCount: 4,
      currentPeriodEnd: periodEnd,
      totalPriceCents: 999,
      discountAmountCents: 100,
      taxAmountCents: 80,
    });
    port.getCustomerSubscription.mockResolvedValue(subscription);
    port.createSubscriptionOrder.mockResolvedValue({ subscriptionOrderId: 'ord-1' } as never);
    const useCase = new ProcessBillingCycleUseCase(port);

    const order = await useCase.execute('sub-1');

    expect(port.createSubscriptionOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customerSubscriptionId: 'sub-1',
        billingCycleNumber: 5,
        periodStart: periodEnd,
        subtotalCents: 999,
        discountAmountCents: 100,
        taxAmountCents: 80,
      }),
    );
    expect(port.advanceBillingCycle).toHaveBeenCalledWith('sub-1');
    expect(port.createSubscriptionOrder.mock.invocationCallOrder[0]).toBeLessThan(
      port.advanceBillingCycle.mock.invocationCallOrder[0],
    );
    expect(order).toEqual({ subscriptionOrderId: 'ord-1' });
  });

  it('should throw SubscriptionNotFoundError for an unknown subscription', async () => {
    const port = makePort();
    port.getCustomerSubscription.mockResolvedValue(null);
    const useCase = new ProcessBillingCycleUseCase(port);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(SubscriptionNotFoundError);
    expect(port.createSubscriptionOrder).not.toHaveBeenCalled();
    expect(port.advanceBillingCycle).not.toHaveBeenCalled();
  });
});
