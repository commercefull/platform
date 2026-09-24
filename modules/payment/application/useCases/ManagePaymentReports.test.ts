import { lazyMock, createPaymentReport } from '../../tests/testUtils';
import { ManagePaymentReportsUseCase } from './ManagePaymentReports';
import type { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';

describe('ManagePaymentReportsUseCase', () => {
  let useCase: ManagePaymentReportsUseCase;
  let repo: jest.Mocked<PaymentBillingRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentBillingRepository>();
    useCase = new ManagePaymentReportsUseCase(repo);
  });

  it('should find all reports', async () => {
    repo.findAllReports.mockResolvedValue([createPaymentReport()]);

    const result = await useCase.findAll();

    expect(result).toHaveLength(1);
  });

  it('should find a report by ID', async () => {
    repo.findReportById.mockResolvedValue(createPaymentReport({ paymentReportId: 'r1' }));

    const result = await useCase.findById('r1');

    expect(result?.paymentReportId).toBe('r1');
  });
});
