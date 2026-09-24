import { emitMock, createShippingLabelPort, createShippingLabel } from '../../tests/testUtils';
import { VoidShippingLabelUseCase } from './VoidShippingLabel';

describe('VoidShippingLabelUseCase', () => {
  let useCase: VoidShippingLabelUseCase;
  let labelRepo: ReturnType<typeof createShippingLabelPort>;

  beforeEach(() => {
    jest.resetAllMocks();
    labelRepo = createShippingLabelPort();
    useCase = new VoidShippingLabelUseCase(labelRepo);
  });

  it('should void the label and emit shipping.label.voided', async () => {
    labelRepo.voidLabel.mockResolvedValue(createShippingLabel({ shippingLabelId: 'l1', status: 'voided' }));

    const result = await useCase.execute({ shippingLabelId: 'l1', reason: 'damaged' });

    expect(result.voided).toBe(true);
    expect(result.label?.shippingLabelId).toBe('l1');
    expect(labelRepo.voidLabel).toHaveBeenCalledWith('l1', 'damaged');
    expect(emitMock).toHaveBeenCalledWith('shipping.label.voided', expect.objectContaining({ shippingLabelId: 'l1', reason: 'damaged' }));
  });

  it('should return voided=false when the label cannot be voided', async () => {
    labelRepo.voidLabel.mockResolvedValue(null);

    const result = await useCase.execute({ shippingLabelId: 'nonexistent' });

    expect(result.voided).toBe(false);
    expect(result.label).toBeNull();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
