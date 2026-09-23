import { createShippingLabelPort, createShippingLabel } from '../../tests/testUtils';
import { GetShippingLabelUseCase } from './GetShippingLabel';

describe('GetShippingLabelUseCase', () => {
  let useCase: GetShippingLabelUseCase;
  let labelRepo: ReturnType<typeof createShippingLabelPort>;

  beforeEach(() => {
    labelRepo = createShippingLabelPort();
    useCase = new GetShippingLabelUseCase(labelRepo);
  });

  it('should find a label by ID', async () => {
    labelRepo.findById.mockResolvedValue(createShippingLabel({ shippingLabelId: 'l1' }));

    const result = await useCase.execute({ shippingLabelId: 'l1' });

    expect(result.found).toBe(true);
    expect(result.label?.shippingLabelId).toBe('l1');
    expect(labelRepo.findByTrackingNumber).not.toHaveBeenCalled();
  });

  it('should find a label by tracking number', async () => {
    labelRepo.findByTrackingNumber.mockResolvedValue(createShippingLabel({ trackingNumber: 'TRK123' }));

    const result = await useCase.execute({ trackingNumber: 'TRK123' });

    expect(result.found).toBe(true);
    expect(result.label?.trackingNumber).toBe('TRK123');
  });

  it('should return not found when neither ID nor tracking number is provided', async () => {
    const result = await useCase.execute({});

    expect(result.found).toBe(false);
    expect(result.label).toBeNull();
    expect(labelRepo.findById).not.toHaveBeenCalled();
  });

  it('should return not found when the label does not exist', async () => {
    labelRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ shippingLabelId: 'missing' });

    expect(result.found).toBe(false);
    expect(result.label).toBeNull();
  });
});
