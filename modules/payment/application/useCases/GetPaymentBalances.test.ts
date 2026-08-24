jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      findAllBalances: jest.fn().mockResolvedValue([{ balanceId: 'b1', amount: 500 }]),
    },
  },
}));

import { GetPaymentBalancesUseCase } from './GetPaymentBalances';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const mockRepo = paymentBillingDataRepository as unknown as { billing: Record<string, jest.Mock> };

describe('GetPaymentBalancesUseCase', () => {
  let useCase: GetPaymentBalancesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetPaymentBalancesUseCase();
  });

  it('should find all balances', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
    expect(mockRepo.billing.findAllBalances).toHaveBeenCalled();
  });
});
