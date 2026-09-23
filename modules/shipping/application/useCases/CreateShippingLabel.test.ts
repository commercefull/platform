import {
  emitMock,
  createShippingLabelPort,
  createShippingCarrierPort,
  createShippingCarrier,
  createShippingLabel,
} from '../../tests/testUtils';
import { CreateShippingLabelUseCase } from './CreateShippingLabel';
import { ShippingCarrierNotFoundError, ShippingValidationError } from '../../domain/errors/ShippingErrors';

describe('CreateShippingLabelUseCase', () => {
  let useCase: CreateShippingLabelUseCase;
  let labelRepo: ReturnType<typeof createShippingLabelPort>;
  let carrierRepo: ReturnType<typeof createShippingCarrierPort>;

  beforeEach(() => {
    jest.resetAllMocks();
    labelRepo = createShippingLabelPort();
    carrierRepo = createShippingCarrierPort();
    carrierRepo.findById.mockResolvedValue(createShippingCarrier({ shippingCarrierId: 'c1', name: 'UPS' }));
    labelRepo.create.mockImplementation(async input => createShippingLabel({ ...input, shippingLabelId: 'l1' }));
    useCase = new CreateShippingLabelUseCase(labelRepo, carrierRepo);
  });

  it('should create a label and emit shipping.label_created', async () => {
    const result = await useCase.execute({ shippingCarrierId: 'c1', trackingNumber: 'TRK123', orderId: 'o1' });

    expect(result.shippingLabelId).toBe('l1');
    expect(result.trackingNumber).toBe('TRK123');
    expect(labelRepo.create).toHaveBeenCalledWith(expect.objectContaining({ carrierName: 'UPS', labelFormat: 'PDF' }));
    expect(emitMock).toHaveBeenCalledWith('shipping.label_created', expect.objectContaining({ shippingLabelId: 'l1', orderId: 'o1' }));
  });

  it('should throw ShippingCarrierNotFoundError when the carrier does not exist', async () => {
    carrierRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ shippingCarrierId: 'nonexistent', trackingNumber: 'TRK123' })).rejects.toThrow(
      ShippingCarrierNotFoundError,
    );
    expect(labelRepo.create).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw ShippingValidationError when the carrier is inactive', async () => {
    carrierRepo.findById.mockResolvedValue(createShippingCarrier({ isActive: false }));

    await expect(useCase.execute({ shippingCarrierId: 'c1', trackingNumber: 'TRK123' })).rejects.toThrow(ShippingValidationError);
    expect(labelRepo.create).not.toHaveBeenCalled();
  });
});
