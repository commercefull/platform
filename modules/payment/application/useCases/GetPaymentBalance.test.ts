import { lazyMock, createPaymentBalance } from '../../tests/testUtils';
import { GetPaymentBalanceUseCase, GetPaymentBalanceCommand } from './GetPaymentBalance';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';

describe('GetPaymentBalanceUseCase', () => {
  let useCase: GetPaymentBalanceUseCase;
  let repo: jest.Mocked<PaymentBillingRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentBillingRepository>();
    useCase = new GetPaymentBalanceUseCase(repo);
  });

  it('should return balances without a currency filter', async () => {
    repo.findBalancesByMerchant.mockResolvedValue([createPaymentBalance({ amountCents: 500 })]);

    const result = await useCase.execute(new GetPaymentBalanceCommand('org1'));

    expect(result.organizationId).toBe('org1');
    expect(result.balances).toHaveLength(1);
    expect(result.currentBalanceCents).toBeUndefined();
  });

  it('should return the current balance when a currency is specified', async () => {
    repo.findBalancesByMerchant.mockResolvedValue([createPaymentBalance()]);
    repo.getBalance.mockResolvedValue(500);

    const result = await useCase.execute(new GetPaymentBalanceCommand('org1', 'USD'));

    expect(result.currentBalanceCents).toBe(500);
    expect(repo.getBalance).toHaveBeenCalledWith('org1', 'USD');
  });
});
