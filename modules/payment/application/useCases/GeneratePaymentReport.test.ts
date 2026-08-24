jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      createReport: jest.fn().mockResolvedValue({
        paymentReportId: 'r1', organizationId: 'org1', type: 'monthly',
        currency: 'USD', totalAmount: 5000, transactionCount: 100,
        periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31'),
        createdAt: new Date('2026-02-01'),
      }),
      findAllReports: jest.fn(),
      findReportById: jest.fn(),
    },
  },
}));

import { GeneratePaymentReportUseCase, GeneratePaymentReportCommand } from './GeneratePaymentReport';
import { PeriodEndMustBeAfterStartError, FailedToGenerateReportError } from '../../domain/errors/PaymentErrors';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const mockRepo = paymentBillingDataRepository as unknown as { billing: Record<string, jest.Mock> };

describe('GeneratePaymentReportUseCase', () => {
  let useCase: GeneratePaymentReportUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GeneratePaymentReportUseCase();
  });

  it('should generate payment report (happy path)', async () => {
    const result = await useCase.execute(new GeneratePaymentReportCommand(
      'org1', 'monthly', 'USD',
      new Date('2026-01-01'), new Date('2026-01-31'),
      5000, 100,
    ));

    expect(result.paymentReportId).toBe('r1');
    expect(result.totalAmount).toBe(5000);
  });

  it('should throw PeriodEndMustBeAfterStartError', async () => {
    await expect(useCase.execute(new GeneratePaymentReportCommand(
      'org1', 'monthly', 'USD',
      new Date('2026-01-31'), new Date('2026-01-01'),
      5000, 100,
    ))).rejects.toThrow(PeriodEndMustBeAfterStartError);
  });

  it('should throw FailedToGenerateReportError when report is null', async () => {
    mockRepo.billing.createReport.mockResolvedValueOnce(null);

    await expect(useCase.execute(new GeneratePaymentReportCommand(
      'org1', 'monthly', 'USD',
      new Date('2026-01-01'), new Date('2026-01-31'),
      5000, 100,
    ))).rejects.toThrow(FailedToGenerateReportError);
  });
});
