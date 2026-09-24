import { lazyMock, createPaymentDispute, createPaymentTransaction } from '../../tests/testUtils';
import { RecordPaymentDisputeUseCase, RecordPaymentDisputeCommand } from './RecordPaymentDispute';
import { FailedToCreatePaymentDisputeError } from '../../domain/errors/PaymentErrors';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';
import type { PaymentGatewayRepository } from '../../domain/repositories/PaymentGatewayRepository';

describe('RecordPaymentDisputeUseCase', () => {
  let useCase: RecordPaymentDisputeUseCase;
  let billingRepo: jest.Mocked<PaymentBillingRepository>;
  let txRepo: jest.Mocked<PaymentGatewayRepository>;

  beforeEach(() => {
    billingRepo = lazyMock<PaymentBillingRepository>();
    txRepo = lazyMock<PaymentGatewayRepository>();
    billingRepo.createDispute.mockResolvedValue(createPaymentDispute({ paymentDisputeId: 'd1' }));
    txRepo.findTransactionById.mockResolvedValue(createPaymentTransaction({ paymentTransactionId: 'pt1' }));
    useCase = new RecordPaymentDisputeUseCase(billingRepo, txRepo);
  });

  it('should record a payment dispute', async () => {
    const result = await useCase.execute(new RecordPaymentDisputeCommand('p1', 'org1', 100, 'USD', 'open', 'ext1', 'Fraud'));

    expect(result.paymentDisputeId).toBe('d1');
    expect(result.status).toBe('open');
    expect(billingRepo.createDispute).toHaveBeenCalledWith(expect.objectContaining({ paymentId: 'p1', organizationId: 'org1' }));
  });

  it('should throw FailedToCreatePaymentDisputeError when creation fails', async () => {
    billingRepo.createDispute.mockResolvedValueOnce(null);

    await expect(useCase.execute(new RecordPaymentDisputeCommand('p1', 'org1', 100, 'USD'))).rejects.toThrow(
      FailedToCreatePaymentDisputeError,
    );
  });
});
