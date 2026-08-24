jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      findBalancesByMerchant: jest.fn().mockResolvedValue([
        { paymentBalanceId: 'b1', currency: 'USD', amount: 500, updatedAt: new Date() },
      ]),
      getBalance: jest.fn().mockResolvedValue(500),
    },
  },
}));

import { GetPaymentBalanceUseCase, GetPaymentBalanceCommand } from './GetPaymentBalance';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const mockRepo = paymentBillingDataRepository as unknown as { billing: Record<string, jest.Mock> };

describe('GetPaymentBalanceUseCase', () => {
  let useCase: GetPaymentBalanceUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetPaymentBalanceUseCase();
  });

  it('should get balances without currency filter (happy path)', async () => {
    const result = await useCase.execute(new GetPaymentBalanceCommand('org1'));

    expect(result.organizationId).toBe('org1');
    expect(result.balances).toHaveLength(1);
    expect(result.currentBalance).toBeUndefined();
  });

  it('should get current balance when currency specified', async () => {
    const result = await useCase.execute(new GetPaymentBalanceCommand('org1', 'USD'));

    expect(result.currentBalance).toBe(500);
    expect(mockRepo.billing.getBalance).toHaveBeenCalledWith('org1', 'USD');
  });
});
