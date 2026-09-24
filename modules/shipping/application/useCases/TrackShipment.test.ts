import { createShippingLabelPort, createShippingLabel } from '../../tests/testUtils';
import { TrackShipmentUseCase } from './TrackShipment';

describe('TrackShipmentUseCase', () => {
  let useCase: TrackShipmentUseCase;
  let labelRepo: ReturnType<typeof createShippingLabelPort>;

  beforeEach(() => {
    labelRepo = createShippingLabelPort();
    useCase = new TrackShipmentUseCase(labelRepo);
  });

  it('should return tracking info by tracking number', async () => {
    labelRepo.findByTrackingNumber.mockResolvedValue(
      createShippingLabel({ trackingNumber: 'TRK123', status: 'in_transit', carrierName: 'FedEx' }),
    );

    const result = await useCase.execute({ trackingNumber: 'TRK123' });

    expect(result.found).toBe(true);
    expect(result.tracking?.trackingNumber).toBe('TRK123');
    expect(result.tracking?.status).toBe('in_transit');
  });

  it('should return tracking info by shipping label ID', async () => {
    labelRepo.findById.mockResolvedValue(createShippingLabel({ shippingLabelId: 'sl-2', status: 'delivered' }));

    const result = await useCase.execute({ shippingLabelId: 'sl-2' });

    expect(result.found).toBe(true);
    expect(result.tracking?.shippingLabelId).toBe('sl-2');
  });

  it('should return not found when the shipment does not exist', async () => {
    labelRepo.findByTrackingNumber.mockResolvedValue(null);

    const result = await useCase.execute({ trackingNumber: 'MISSING' });

    expect(result.found).toBe(false);
    expect(result.tracking).toBeNull();
  });

  it('should return not found when no identifier is provided', async () => {
    const result = await useCase.execute({});

    expect(result.found).toBe(false);
    expect(labelRepo.findById).not.toHaveBeenCalled();
    expect(labelRepo.findByTrackingNumber).not.toHaveBeenCalled();
  });
});
