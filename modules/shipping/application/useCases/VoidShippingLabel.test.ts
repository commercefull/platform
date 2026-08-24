jest.mock('../../infrastructure/repositories/ShippingLabelAggregateRepository', () => ({
  __esModule: true,
  default: {
    voidLabel: jest.fn().mockResolvedValue({
      shippingLabelId: 'l1', trackingNumber: 'TRK123', status: 'voided',
    }),
  },
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

import { VoidShippingLabelUseCase } from './VoidShippingLabel';
import { eventBus } from '../../../../libs/events/eventBus';
import shippingLabelRepo from '../../infrastructure/repositories/ShippingLabelAggregateRepository';

const mockRepo = shippingLabelRepo as unknown as { voidLabel: jest.Mock };

describe('VoidShippingLabelUseCase', () => {
  let useCase: VoidShippingLabelUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new VoidShippingLabelUseCase();
  });

  it('should void label (happy path)', async () => {
    const result = await useCase.execute({ shippingLabelId: 'l1', reason: 'damaged' });

    expect(result.voided).toBe(true);
    expect(result.label?.shippingLabelId).toBe('l1');
    expect(eventBus.emit).toHaveBeenCalledWith('shipping.label.voided', expect.objectContaining({
      shippingLabelId: 'l1',
      reason: 'damaged',
    }));
  });

  it('should return voided=false when label not found', async () => {
    mockRepo.voidLabel.mockResolvedValueOnce(null);

    const result = await useCase.execute({ shippingLabelId: 'nonexistent' });

    expect(result.voided).toBe(false);
    expect(result.label).toBeNull();
  });
});
