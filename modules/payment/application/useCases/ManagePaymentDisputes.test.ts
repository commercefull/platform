import { lazyMock, createPaymentDispute } from '../../tests/testUtils';
import { ManagePaymentDisputesUseCase } from './ManagePaymentDisputes';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';

describe('ManagePaymentDisputesUseCase', () => {
  let useCase: ManagePaymentDisputesUseCase;
  let repo: jest.Mocked<PaymentBillingRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentBillingRepository>();
    useCase = new ManagePaymentDisputesUseCase(repo);
  });

  it('should find all disputes', async () => {
    repo.findAllDisputes.mockResolvedValue([createPaymentDispute()]);

    const result = await useCase.findAll('open', 10);

    expect(result).toHaveLength(1);
    expect(repo.findAllDisputes).toHaveBeenCalledWith('open', 10);
  });

  it('should find a dispute by ID', async () => {
    repo.findDisputeById.mockResolvedValue(createPaymentDispute({ paymentDisputeId: 'd1' }));

    const result = await useCase.findById('d1');

    expect(result?.paymentDisputeId).toBe('d1');
  });

  it('should update dispute status', async () => {
    const resolvedAt = new Date();
    repo.updateDisputeStatus.mockResolvedValue(createPaymentDispute({ status: 'resolved', resolvedAt }));

    await useCase.updateStatus('d1', 'resolved', resolvedAt);

    expect(repo.updateDisputeStatus).toHaveBeenCalledWith('d1', 'resolved', resolvedAt);
  });
});
