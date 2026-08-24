jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      findAllFees: jest.fn().mockResolvedValue([{ feeId: 'f1', amount: 5 }]),
    },
  },
}));

import { ManagePaymentFeesUseCase } from './ManagePaymentFees';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const mockRepo = paymentBillingDataRepository as unknown as { billing: Record<string, jest.Mock> };

describe('ManagePaymentFeesUseCase', () => {
  let useCase: ManagePaymentFeesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManagePaymentFeesUseCase();
  });

  it('should find all fees', async () => {
    const result = await useCase.findAll(10);
    expect(result).toHaveLength(1);
    expect(mockRepo.billing.findAllFees).toHaveBeenCalledWith(10);
  });
});
