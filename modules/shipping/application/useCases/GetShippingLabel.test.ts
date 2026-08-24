jest.mock('../../infrastructure/repositories/ShippingLabelAggregateRepository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({
      shippingLabelId: 'l1', trackingNumber: 'TRK123', shippingCarrierId: 'c1',
    }),
    findByTrackingNumber: jest.fn().mockResolvedValue({
      shippingLabelId: 'l1', trackingNumber: 'TRK123', shippingCarrierId: 'c1',
    }),
  },
}));

import { GetShippingLabelUseCase } from './GetShippingLabel';

describe('GetShippingLabelUseCase', () => {
  let useCase: GetShippingLabelUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetShippingLabelUseCase();
  });

  it('should find label by ID', async () => {
    const result = await useCase.execute({ shippingLabelId: 'l1' });
    expect(result.found).toBe(true);
    expect(result.label?.shippingLabelId).toBe('l1');
  });

  it('should find label by tracking number', async () => {
    const result = await useCase.execute({ trackingNumber: 'TRK123' });
    expect(result.found).toBe(true);
    expect(result.label?.trackingNumber).toBe('TRK123');
  });

  it('should return not found when neither ID nor tracking number provided', async () => {
    const result = await useCase.execute({});
    expect(result.found).toBe(false);
    expect(result.label).toBeNull();
  });
});
