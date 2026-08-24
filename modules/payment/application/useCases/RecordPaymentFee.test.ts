jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      createFee: jest.fn().mockResolvedValue({
        paymentFeeId: 'f1', transactionId: 't1', organizationId: 'org1', type: 'processing',
        amount: 5, currency: 'USD', description: 'Processing fee', createdAt: new Date(),
      }),
    },
  },
}));

import { RecordPaymentFeeUseCase, RecordPaymentFeeCommand } from './RecordPaymentFee';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';
import { FailedToCreatePaymentFeeError } from '../../domain/errors/PaymentErrors';

const mockRepo = paymentBillingDataRepository as unknown as { billing: Record<string, jest.Mock> };

describe('RecordPaymentFeeUseCase', () => {
  let useCase: RecordPaymentFeeUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RecordPaymentFeeUseCase();
  });

  it('should record payment fee (happy path)', async () => {
    const result = await useCase.execute(new RecordPaymentFeeCommand(
      't1', 'org1', 'processing', 5, 'USD', 'Processing fee',
    ));

    expect(result.paymentFeeId).toBe('f1');
    expect(result.amount).toBe(5);
  });

  it('should throw FailedToCreatePaymentFeeError when fee creation fails', async () => {
    mockRepo.billing.createFee.mockResolvedValueOnce(null);

    await expect(useCase.execute(new RecordPaymentFeeCommand('t1', 'org1', 'processing', 5, 'USD'))).rejects.toThrow(FailedToCreatePaymentFeeError);
  });
});
