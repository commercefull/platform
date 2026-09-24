import { lazyMock, createPaymentFee } from '../../tests/testUtils';
import { RecordPaymentFeeUseCase, RecordPaymentFeeCommand } from './RecordPaymentFee';
import { FailedToCreatePaymentFeeError } from '../../domain/errors/PaymentErrors';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';

describe('RecordPaymentFeeUseCase', () => {
  let useCase: RecordPaymentFeeUseCase;
  let repo: jest.Mocked<PaymentBillingRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentBillingRepository>();
    repo.createFee.mockResolvedValue(createPaymentFee({ paymentFeeId: 'f1', amountCents: 5 }));
    useCase = new RecordPaymentFeeUseCase(repo);
  });

  it('should record a payment fee', async () => {
    const result = await useCase.execute(new RecordPaymentFeeCommand('t1', 'org1', 'processing', 5, 'USD', 'Processing fee'));

    expect(result.paymentFeeId).toBe('f1');
    expect(result.amountCents).toBe(5);
  });

  it('should throw FailedToCreatePaymentFeeError when fee creation fails', async () => {
    repo.createFee.mockResolvedValueOnce(null);

    await expect(useCase.execute(new RecordPaymentFeeCommand('t1', 'org1', 'processing', 5, 'USD'))).rejects.toThrow(
      FailedToCreatePaymentFeeError,
    );
  });
});
