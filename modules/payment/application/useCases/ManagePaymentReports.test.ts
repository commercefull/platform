jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      findAllReports: jest.fn().mockResolvedValue([{ paymentReportId: 'r1' }]),
      findReportById: jest.fn().mockResolvedValue({ paymentReportId: 'r1' }),
      createReport: jest.fn().mockResolvedValue({
        paymentReportId: 'r1', organizationId: 'org1', type: 'monthly',
        currency: 'USD', totalAmount: 5000, transactionCount: 100,
        periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31'),
        createdAt: new Date('2026-02-01'),
      }),
    },
  },
}));

import { ManagePaymentReportsUseCase } from './ManagePaymentReports';

describe('ManagePaymentReportsUseCase', () => {
  let useCase: ManagePaymentReportsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManagePaymentReportsUseCase();
  });

  it('should find all reports', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find report by ID', async () => {
    const result = await useCase.findById('r1');
    expect(result).toEqual({ paymentReportId: 'r1' });
  });
});
