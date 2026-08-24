jest.mock('../../infrastructure/repositories/PaymentBillingDataRepository', () => ({
  __esModule: true,
  default: {
    billing: {
      findAllDisputes: jest.fn().mockResolvedValue([{ disputeId: 'd1' }]),
      findDisputeById: jest.fn().mockResolvedValue({ disputeId: 'd1' }),
      updateDisputeStatus: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

import { ManagePaymentDisputesUseCase } from './ManagePaymentDisputes';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const mockRepo = paymentBillingDataRepository as unknown as { billing: Record<string, jest.Mock> };

describe('ManagePaymentDisputesUseCase', () => {
  let useCase: ManagePaymentDisputesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManagePaymentDisputesUseCase();
  });

  it('should find all disputes', async () => {
    const result = await useCase.findAll('open', 10);
    expect(result).toHaveLength(1);
    expect(mockRepo.billing.findAllDisputes).toHaveBeenCalledWith('open', 10);
  });

  it('should find dispute by ID', async () => {
    const result = await useCase.findById('d1');
    expect(result).toEqual({ disputeId: 'd1' });
  });

  it('should update dispute status', async () => {
    await useCase.updateStatus('d1', 'resolved', new Date());
    expect(mockRepo.billing.updateDisputeStatus).toHaveBeenCalledWith('d1', 'resolved', expect.any(Date));
  });
});
