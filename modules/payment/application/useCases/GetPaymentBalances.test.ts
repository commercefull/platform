import { lazyMock, createPaymentBalance } from '../../tests/testUtils';
import { GetPaymentBalancesUseCase } from './GetPaymentBalances';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';

describe('GetPaymentBalancesUseCase', () => {
  let useCase: GetPaymentBalancesUseCase;
  let repo: jest.Mocked<PaymentBillingRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentBillingRepository>();
    useCase = new GetPaymentBalancesUseCase(repo);
  });

  it('should find all balances', async () => {
    repo.findAllBalances.mockResolvedValue([createPaymentBalance()]);

    const result = await useCase.findAll();

    expect(result).toHaveLength(1);
    expect(repo.findAllBalances).toHaveBeenCalled();
  });
});
