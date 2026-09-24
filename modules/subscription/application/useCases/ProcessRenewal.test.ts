import { emitMock, createProcessRenewalPorts } from '../../tests/testUtils';
import { ProcessRenewalUseCase } from './ProcessRenewal';
import {
  SubscriptionNotFoundError,
  SubscriptionValidationError,
  FailedToProcessRenewalError,
} from '../../domain/errors/SubscriptionErrors';

describe('ProcessRenewalUseCase', () => {
  let useCase: ProcessRenewalUseCase;
  let ports: ReturnType<typeof createProcessRenewalPorts>;

  const dueSubscription = {
    status: 'active',
    customerId: 'cust-1',
    priceCents: 2999,
    planName: 'Monthly Box',
    paymentMethodId: 'pm-1',
    billingInterval: 'monthly',
    nextBillingDate: '2020-01-01',
    renewalCount: 2,
  };

  beforeEach(() => {
    ports = createProcessRenewalPorts();
    ports.subscriptionRepo.findById.mockResolvedValue(dueSubscription);
    ports.invoiceService.create.mockResolvedValue({ invoiceId: 'inv-1' });
    ports.paymentService.charge.mockResolvedValue(undefined);
    useCase = new ProcessRenewalUseCase(ports.subscriptionRepo, ports.paymentService, ports.invoiceService);
  });

  it('should invoice, charge, advance the period and emit renewal events when the subscription is due', async () => {
    const result = await useCase.execute({ subscriptionId: 'sub-1' });

    expect(result.renewed).toBe(true);
    expect(result.amountChargedCents).toBe(2999);
    expect(result.invoiceId).toBe('inv-1');
    expect(ports.invoiceService.create).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: 'sub-1', customerId: 'cust-1', amountCents: 2999 }),
    );
    expect(ports.paymentService.charge).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1', amountCents: 2999, paymentMethodId: 'pm-1', invoiceId: 'inv-1' }),
    );
    expect(ports.subscriptionRepo.update).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ renewalCount: 3, lastRenewalAt: expect.any(Date) }),
    );
    expect(emitMock).toHaveBeenCalledWith('subscription.renewed', expect.objectContaining({ subscriptionId: 'sub-1' }));
    expect(emitMock).toHaveBeenCalledWith(
      'subscription.payment.success',
      expect.objectContaining({ subscriptionId: 'sub-1', invoiceId: 'inv-1' }),
    );
  });

  it('should enter dunning and emit payment.failed when the charge fails', async () => {
    ports.paymentService.charge.mockRejectedValue(new Error('card declined'));

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(FailedToProcessRenewalError);

    expect(ports.subscriptionRepo.update).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ status: 'past_due' }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'subscription.payment.failed',
      expect.objectContaining({ subscriptionId: 'sub-1', amountCents: 2999 }),
    );
    expect(emitMock).not.toHaveBeenCalledWith('subscription.renewed', expect.anything());
  });

  it('should throw SubscriptionValidationError when the subscription ID is empty', async () => {
    await expect(useCase.execute({ subscriptionId: '' })).rejects.toThrow(SubscriptionValidationError);
  });

  it('should throw SubscriptionNotFoundError when the subscription does not exist', async () => {
    ports.subscriptionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ subscriptionId: 'missing' })).rejects.toThrow(SubscriptionNotFoundError);
  });

  it('should throw SubscriptionValidationError when the subscription is not active', async () => {
    ports.subscriptionRepo.findById.mockResolvedValue({ ...dueSubscription, status: 'paused' });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
    expect(ports.paymentService.charge).not.toHaveBeenCalled();
  });

  it('should throw SubscriptionValidationError when the subscription is not yet due', async () => {
    ports.subscriptionRepo.findById.mockResolvedValue({
      ...dueSubscription,
      nextBillingDate: new Date(Date.now() + 86400000).toISOString(),
    });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(SubscriptionValidationError);
    expect(ports.invoiceService.create).not.toHaveBeenCalled();
  });
});
