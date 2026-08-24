jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      createDispute: jest.fn().mockResolvedValue({
        paymentDisputeId: 'd1', paymentId: 'p1', organizationId: 'org1', externalDisputeId: 'ext1',
        status: 'open', reason: 'Fraud', amount: 100, currency: 'USD', dueBy: undefined, createdAt: new Date(),
      }),
    },
  },
}));

jest.mock('../../infrastructure/repositories/PaymentDataRepository', () => ({
  __esModule: true,
  default: {
    gateways: {
      findTransactionById: jest.fn().mockResolvedValue({ paymentTransactionId: 'pt1' }),
      updateTransaction: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

import { RecordPaymentDisputeUseCase, RecordPaymentDisputeCommand } from './RecordPaymentDispute';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';
import { FailedToCreatePaymentDisputeError } from '../../domain/errors/PaymentErrors';

const mockRepo = paymentBillingDataRepository as unknown as { billing: Record<string, jest.Mock> };

describe('RecordPaymentDisputeUseCase', () => {
  let useCase: RecordPaymentDisputeUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RecordPaymentDisputeUseCase();
  });

  it('should record payment dispute (happy path)', async () => {
    const result = await useCase.execute(new RecordPaymentDisputeCommand(
      'p1', 'org1', 100, 'USD', 'open', 'ext1', 'Fraud',
    ));

    expect(result.paymentDisputeId).toBe('d1');
    expect(result.status).toBe('open');
  });

  it('should throw FailedToCreatePaymentDisputeError when creation fails', async () => {
    mockRepo.billing.createDispute.mockResolvedValueOnce(null);

    await expect(useCase.execute(new RecordPaymentDisputeCommand('p1', 'org1', 100, 'USD'))).rejects.toThrow(FailedToCreatePaymentDisputeError);
  });
});
