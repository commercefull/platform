import { lazyMock, createPaymentReport } from '../../tests/testUtils';
import { GeneratePaymentReportUseCase, GeneratePaymentReportCommand } from './GeneratePaymentReport';
import { PeriodEndMustBeAfterStartError, FailedToGenerateReportError } from '../../domain/errors/PaymentErrors';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';

describe('GeneratePaymentReportUseCase', () => {
  let useCase: GeneratePaymentReportUseCase;
  let repo: jest.Mocked<PaymentBillingRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentBillingRepository>();
    repo.createReport.mockResolvedValue(createPaymentReport({ paymentReportId: 'r1' }));
    useCase = new GeneratePaymentReportUseCase(repo);
  });

  it('should generate a payment report', async () => {
    const result = await useCase.execute(
      new GeneratePaymentReportCommand('org1', 'monthly', 'USD', new Date('2026-01-01'), new Date('2026-01-31'), 5000, 100),
    );

    expect(result.paymentReportId).toBe('r1');
    expect(result.totalAmount).toBe(5000);
  });

  it('should throw PeriodEndMustBeAfterStartError when end precedes start', async () => {
    await expect(
      useCase.execute(
        new GeneratePaymentReportCommand('org1', 'monthly', 'USD', new Date('2026-01-31'), new Date('2026-01-01'), 5000, 100),
      ),
    ).rejects.toThrow(PeriodEndMustBeAfterStartError);
  });

  it('should throw FailedToGenerateReportError when the report is not persisted', async () => {
    repo.createReport.mockResolvedValueOnce(null);

    await expect(
      useCase.execute(
        new GeneratePaymentReportCommand('org1', 'monthly', 'USD', new Date('2026-01-01'), new Date('2026-01-31'), 5000, 100),
      ),
    ).rejects.toThrow(FailedToGenerateReportError);
  });
});
