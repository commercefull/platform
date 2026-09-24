import { lazyMock, createPaymentFee } from '../../tests/testUtils';
import { ManagePaymentFeesUseCase } from './ManagePaymentFees';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';

describe('ManagePaymentFeesUseCase', () => {
  let useCase: ManagePaymentFeesUseCase;
  let repo: jest.Mocked<PaymentBillingRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentBillingRepository>();
    useCase = new ManagePaymentFeesUseCase(repo);
  });

  it('should find all fees', async () => {
    repo.findAllFees.mockResolvedValue([createPaymentFee({ amountCents: 5 })]);

    const result = await useCase.findAll(10);

    expect(result).toHaveLength(1);
    expect(repo.findAllFees).toHaveBeenCalledWith(10);
  });
});
