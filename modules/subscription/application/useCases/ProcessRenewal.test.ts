jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ProcessRenewalUseCase} from './ProcessRenewal';
import { SubscriptionNotFoundError, SubscriptionValidationError, FailedToProcessRenewalError } from '../../domain/errors/SubscriptionErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ProcessRenewalUseCase', () => {
  let useCase: ProcessRenewalUseCase;
  let mockSubRepo: Record<string, jest.Mock>;
  let mockPaymentService: Record<string, jest.Mock>;
  let mockInvoiceService: Record<string, jest.Mock>;

  beforeEach(() => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    mockSubRepo = {
      findById: jest.fn().mockResolvedValue({
        status: 'active', customerId: 'c1', nextBillingDate: pastDate, price: 29.99,
        planName: 'Pro', paymentMethodId: 'pm-1', billingInterval: 'monthly', renewalCount: 0,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockPaymentService = { charge: jest.fn().mockResolvedValue(undefined) };
    mockInvoiceService = { create: jest.fn().mockResolvedValue({ invoiceId: 'inv-1' }) };
    useCase = new ProcessRenewalUseCase(mockSubRepo as never, mockPaymentService as never, mockInvoiceService as never);
  });

  it('should process renewal successfully (happy path)', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1' });

    expect(result.renewed).toBe(true);
    expect(result.amountCharged).toBe(29.99);
    expect(result.invoiceId).toBe('inv-1');
    expect(eventBus.emit).toHaveBeenCalledWith('subscription.renewed', expect.objectContaining({ subscriptionId: 'sub-1' }));
  });

  it('should throw SubscriptionValidationError when id is empty', async () => {
    await expect(useCase.execute({ subscriptionId: '' })).rejects.toThrow(SubscriptionValidationError);
  });

  it('should throw SubscriptionNotFoundError when subscription does not exist', async () => {
    mockSubRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'missing' })).rejects.toThrow(SubscriptionNotFoundError);
  });

  it('should throw SubscriptionValidationError when subscription is not active', async () => {
    mockSubRepo.findById.mockResolvedValue({ status: 'paused', customerId: 'c1', nextBillingDate: new Date(Date.now() - 86400000).toISOString(), price: 10, planName: 'P', paymentMethodId: 'pm', billingInterval: 'monthly' });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
  });

  it('should throw SubscriptionValidationError when not yet due for renewal', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockSubRepo.findById.mockResolvedValue({ status: 'active', customerId: 'c1', nextBillingDate: futureDate, price: 10, planName: 'P', paymentMethodId: 'pm', billingInterval: 'monthly' });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
  });

  it('should throw FailedToProcessRenewalError when payment fails', async () => {
    mockPaymentService.charge.mockRejectedValue(new Error('Payment declined'));

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(FailedToProcessRenewalError);
    expect(eventBus.emit).toHaveBeenCalledWith('subscription.payment.failed', expect.objectContaining({ subscriptionId: 'sub-1' }));
  });
});
