import { ManageCustomerSubscriptionsUseCase, type CustomerSubscriptionPort } from './ManageCustomerSubscriptions';
import { SubscriptionNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';
import {
  createSubscriptionRepository,
  createCustomerSubscription,
  createSubscriptionPlan,
  createSubscriptionProduct,
} from '../../tests/testUtils';
import type { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';

const makePort = (): jest.Mocked<CustomerSubscriptionPort> =>
  createSubscriptionRepository() as jest.Mocked<SubscriptionRepository> as unknown as jest.Mocked<CustomerSubscriptionPort>;

const subscription = createCustomerSubscription({
  customerSubscriptionId: 'sub-1',
  customerId: 'cust-1',
  status: 'active',
  subscriptionProductId: 'prod-1',
});

describe('ManageCustomerSubscriptionsUseCase', () => {
  let port: jest.Mocked<CustomerSubscriptionPort>;
  let useCase: ManageCustomerSubscriptionsUseCase;

  beforeEach(() => {
    port = makePort();
    useCase = new ManageCustomerSubscriptionsUseCase(port);
  });

  describe('subscribe', () => {
    it('should reject when the plan is missing or inactive', async () => {
      port.getSubscriptionPlan.mockResolvedValue(null);
      await expect(useCase.subscribe({ customerId: 'c', subscriptionPlanId: 'p1' })).rejects.toBeInstanceOf(
        SubscriptionValidationError,
      );
      port.getSubscriptionPlan.mockResolvedValue(createSubscriptionPlan({ isActive: false }));
      await expect(useCase.subscribe({ customerId: 'c', subscriptionPlanId: 'p1' })).rejects.toBeInstanceOf(
        SubscriptionValidationError,
      );
      expect(port.createCustomerSubscription).not.toHaveBeenCalled();
    });

    it('should create the subscription with the plan product', async () => {
      const plan = createSubscriptionPlan({ subscriptionPlanId: 'p1', subscriptionProductId: 'prod-1' });
      port.getSubscriptionPlan.mockResolvedValue(plan);
      port.createCustomerSubscription.mockResolvedValue(subscription);

      const result = await useCase.subscribe({ customerId: 'cust-1', subscriptionPlanId: 'p1' });

      expect(port.createCustomerSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          subscriptionPlanId: 'p1',
          subscriptionProductId: 'prod-1',
        }),
      );
      expect(result).toBe(subscription);
    });
  });

  describe('changePlan', () => {
    it('should reject when not owned, not active, or the new plan is invalid', async () => {
      port.getCustomerSubscription.mockResolvedValue(createCustomerSubscription({ customerId: 'other' }));
      await expect(useCase.changePlan('cust-1', 'sub-1', 'p2')).rejects.toBeInstanceOf(SubscriptionNotFoundError);

      port.getCustomerSubscription.mockResolvedValue(createCustomerSubscription({ customerId: 'cust-1', status: 'cancelled' }));
      await expect(useCase.changePlan('cust-1', 'sub-1', 'p2')).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getCustomerSubscription.mockResolvedValue(subscription);
      port.getSubscriptionPlan.mockResolvedValue(null);
      await expect(useCase.changePlan('cust-1', 'sub-1', 'p2')).rejects.toBeInstanceOf(SubscriptionValidationError);
    });

    it('should pass when active and the new plan is valid', async () => {
      port.getCustomerSubscription.mockResolvedValue(subscription);
      port.getSubscriptionPlan.mockResolvedValue(createSubscriptionPlan({ isActive: true }));

      await expect(useCase.changePlan('cust-1', 'sub-1', 'p2')).resolves.toBeUndefined();
    });
  });

  describe('pause', () => {
    it('should enforce ownership, active status, and product pause policy', async () => {
      port.getCustomerSubscription.mockResolvedValue(createCustomerSubscription({ customerId: 'other' }));
      await expect(useCase.pause('cust-1', 'sub-1', {})).rejects.toBeInstanceOf(SubscriptionNotFoundError);

      port.getCustomerSubscription.mockResolvedValue(createCustomerSubscription({ customerId: 'cust-1', status: 'paused' }));
      await expect(useCase.pause('cust-1', 'sub-1', {})).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getCustomerSubscription.mockResolvedValue(subscription);
      port.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowPause: false }));
      await expect(useCase.pause('cust-1', 'sub-1', {})).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowPause: true, maxPausesPerYear: 1 }));
      port.getCustomerSubscription.mockResolvedValue({ ...subscription, pauseCount: 1 });
      await expect(useCase.pause('cust-1', 'sub-1', {})).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getCustomerSubscription.mockResolvedValue(subscription);
      port.getSubscriptionProduct.mockResolvedValue(
        createSubscriptionProduct({ allowPause: true, maxPauseDays: 30 }),
      );
      const farFuture = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      await expect(useCase.pause('cust-1', 'sub-1', { resumeAt: farFuture })).rejects.toBeInstanceOf(
        SubscriptionValidationError,
      );
      expect(port.pauseSubscription).not.toHaveBeenCalled();
    });

    it('should pause when all guards pass', async () => {
      port.getCustomerSubscription.mockResolvedValue(subscription);
      port.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowPause: true }));
      port.pauseSubscription.mockResolvedValue({} as never);

      await useCase.pause('cust-1', 'sub-1', { reason: 'vacation' });

      expect(port.pauseSubscription).toHaveBeenCalledWith('sub-1', undefined, 'vacation', 'customer');
    });
  });

  describe('resume', () => {
    it('should require a paused, owned subscription', async () => {
      port.getCustomerSubscription.mockResolvedValue(null);
      await expect(useCase.resume('cust-1', 'sub-1')).rejects.toBeInstanceOf(SubscriptionNotFoundError);

      port.getCustomerSubscription.mockResolvedValue(subscription);
      await expect(useCase.resume('cust-1', 'sub-1')).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getCustomerSubscription.mockResolvedValue(createCustomerSubscription({ customerId: 'cust-1', status: 'paused' }));
      await useCase.resume('cust-1', 'sub-1');
      expect(port.resumeSubscription).toHaveBeenCalledWith('sub-1', 'customer');
    });
  });

  describe('cancel', () => {
    it('should reject when already cancelled or contract blocks early cancel', async () => {
      port.getCustomerSubscription.mockResolvedValue(createCustomerSubscription({ customerId: 'cust-1', status: 'cancelled' }));
      await expect(useCase.cancel('cust-1', 'sub-1', {})).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getCustomerSubscription.mockResolvedValue({ ...subscription, contractCyclesRemaining: 3 });
      port.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowEarlyCancel: false }));
      await expect(useCase.cancel('cust-1', 'sub-1', {})).rejects.toBeInstanceOf(SubscriptionValidationError);
      expect(port.cancelSubscription).not.toHaveBeenCalled();
    });

    it('should cancel at period end by default', async () => {
      port.getCustomerSubscription.mockResolvedValue(subscription);
      const result = await useCase.cancel('cust-1', 'sub-1', { reason: 'done' });

      expect(port.cancelSubscription).toHaveBeenCalledWith('sub-1', 'done', 'customer', true);
      expect(result.cancelAtPeriodEnd).toBe(true);
    });

    it('should cancel immediately when requested', async () => {
      port.getCustomerSubscription.mockResolvedValue(subscription);
      const result = await useCase.cancel('cust-1', 'sub-1', { cancelAtPeriodEnd: false });

      expect(port.cancelSubscription).toHaveBeenCalledWith('sub-1', undefined, 'customer', false);
      expect(result.cancelAtPeriodEnd).toBe(false);
    });
  });

  describe('reactivate', () => {
    it('should only reactivate a cancel-at-period-end subscription', async () => {
      port.getCustomerSubscription.mockResolvedValue(subscription); // cancelAtPeriodEnd falsy
      await expect(useCase.reactivate('cust-1', 'sub-1')).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getCustomerSubscription.mockResolvedValue({ ...subscription, cancelAtPeriodEnd: true });
      await useCase.reactivate('cust-1', 'sub-1');
      expect(port.updateSubscriptionStatus).toHaveBeenCalledWith('sub-1', 'active', {
        cancelledAt: undefined,
        cancellationReason: undefined,
        cancelledBy: undefined,
      });
    });
  });

  describe('skipNextDelivery', () => {
    it('should enforce allowSkip and maxSkipsPerYear', async () => {
      port.getCustomerSubscription.mockResolvedValue(subscription);
      port.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowSkip: false }));
      await expect(useCase.skipNextDelivery('cust-1', 'sub-1')).rejects.toBeInstanceOf(SubscriptionValidationError);

      port.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowSkip: true, maxSkipsPerYear: 2 }));
      port.getCustomerSubscription.mockResolvedValue({ ...subscription, skipCount: 2 });
      await expect(useCase.skipNextDelivery('cust-1', 'sub-1')).rejects.toBeInstanceOf(SubscriptionValidationError);
      expect(port.advanceBillingCycle).not.toHaveBeenCalled();
    });

    it('should advance the billing cycle when skipping is allowed', async () => {
      port.getCustomerSubscription.mockResolvedValue(subscription);
      port.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowSkip: true }));

      await useCase.skipNextDelivery('cust-1', 'sub-1');
      expect(port.advanceBillingCycle).toHaveBeenCalledWith('sub-1');
    });
  });
});
