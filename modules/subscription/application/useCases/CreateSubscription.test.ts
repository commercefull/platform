/**
 * Unit Tests for CreateSubscription Use Case
 */

import {
  emitMock,
  createCreateSubscriptionRepo,
  createSubscriptionPlan,
  createSubscriptionProduct,
  createCustomerSubscription,
} from '../../tests/testUtils';
import { CreateSubscriptionUseCase, CreateSubscriptionCommand } from './CreateSubscription';

describe('CreateSubscriptionUseCase', () => {
  let useCase: CreateSubscriptionUseCase;
  let subscriptionRepo: ReturnType<typeof createCreateSubscriptionRepo>;

  const validInput = { customerId: 'cust-1', subscriptionPlanId: 'plan-1' };

  beforeEach(() => {
    subscriptionRepo = createCreateSubscriptionRepo();
    subscriptionRepo.getSubscriptionPlan.mockResolvedValue(createSubscriptionPlan());
    subscriptionRepo.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct());
    subscriptionRepo.createCustomerSubscription.mockResolvedValue(createCustomerSubscription());
    useCase = new CreateSubscriptionUseCase(subscriptionRepo);
  });

  it('should create the subscription and emit subscription.created when the input is valid', async () => {
    const result = await useCase.execute(new CreateSubscriptionCommand(validInput));

    expect(result.success).toBe(true);
    expect(result.subscription?.customerSubscriptionId).toBe('sub-1');
    expect(subscriptionRepo.createCustomerSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1', subscriptionPlanId: 'plan-1', quantity: 1 }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'subscription.created',
      expect.objectContaining({ customerSubscriptionId: 'sub-1', customerId: 'cust-1', subscriptionPlanId: 'plan-1' }),
    );
  });

  it('should report a trial status in the message when the plan has trial days', async () => {
    subscriptionRepo.getSubscriptionPlan.mockResolvedValue(createSubscriptionPlan({ trialDays: 14 }));

    const result = await useCase.execute(new CreateSubscriptionCommand(validInput));

    expect(result.success).toBe(true);
    expect(result.message).toContain('14-day trial');
    expect(emitMock).toHaveBeenCalledWith('subscription.created', expect.objectContaining({ status: 'trialing' }));
  });

  it('should return a failure without persistence when customerId is missing', async () => {
    const result = await useCase.execute(new CreateSubscriptionCommand({ ...validInput, customerId: '' }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('customer_id_required');
    expect(subscriptionRepo.createCustomerSubscription).not.toHaveBeenCalled();
  });

  it('should return a failure without persistence when subscriptionPlanId is missing', async () => {
    const result = await useCase.execute(new CreateSubscriptionCommand({ ...validInput, subscriptionPlanId: '' }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('plan_id_required');
    expect(subscriptionRepo.createCustomerSubscription).not.toHaveBeenCalled();
  });

  it('should return a failure when the plan does not exist', async () => {
    subscriptionRepo.getSubscriptionPlan.mockResolvedValue(null);

    const result = await useCase.execute(new CreateSubscriptionCommand(validInput));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('plan_not_found');
    expect(subscriptionRepo.createCustomerSubscription).not.toHaveBeenCalled();
  });

  it('should return a failure when the plan is inactive', async () => {
    subscriptionRepo.getSubscriptionPlan.mockResolvedValue(createSubscriptionPlan({ isActive: false }));

    const result = await useCase.execute(new CreateSubscriptionCommand(validInput));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('plan_inactive');
  });

  it('should return a failure when the subscription product is unavailable', async () => {
    subscriptionRepo.getSubscriptionProduct.mockResolvedValue(null);

    const result = await useCase.execute(new CreateSubscriptionCommand(validInput));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('product_unavailable');
    expect(subscriptionRepo.createCustomerSubscription).not.toHaveBeenCalled();
  });

  it('should return a failure when the repository throws', async () => {
    subscriptionRepo.createCustomerSubscription.mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(new CreateSubscriptionCommand(validInput));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('creation_failed');
    expect(result.message).toBe('DB error');
  });
});
