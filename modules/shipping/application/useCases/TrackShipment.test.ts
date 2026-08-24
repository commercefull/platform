jest.mock('../../infrastructure/repositories/ShippingLabelAggregateRepository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByTrackingNumber: jest.fn(),
  },
}));

import { TrackShipmentUseCase} from './TrackShipment';
import shippingLabelRepo from '../../infrastructure/repositories/ShippingLabelAggregateRepository';

const mockRepo = shippingLabelRepo as unknown as Record<string, jest.Mock>;

describe('TrackShipmentUseCase', () => {
  let useCase: TrackShipmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new TrackShipmentUseCase();
  });

  it('should track shipment by tracking number (happy path)', async () => {
    mockRepo.findByTrackingNumber.mockResolvedValue({
      trackingNumber: 'TRK123', status: 'in_transit', carrierName: 'FedEx',
      labelUrl: 'https://label.url', shippingLabelId: 'sl-1', createdAt: new Date(),
    });

    const result = await useCase.execute({ trackingNumber: 'TRK123' });

    expect(result.found).toBe(true);
    expect(result.tracking!.trackingNumber).toBe('TRK123');
    expect(result.tracking!.status).toBe('in_transit');
  });

  it('should track shipment by shipping label ID', async () => {
    mockRepo.findById.mockResolvedValue({
      trackingNumber: 'TRK456', status: 'delivered', carrierName: 'UPS',
      shippingLabelId: 'sl-2', createdAt: new Date(),
    });

    const result = await useCase.execute({ shippingLabelId: 'sl-2' });

    expect(result.found).toBe(true);
    expect(result.tracking!.shippingLabelId).toBe('sl-2');
  });

  it('should return found=false when shipment not found', async () => {
    mockRepo.findByTrackingNumber.mockResolvedValue(null);

    const result = await useCase.execute({ trackingNumber: 'MISSING' });

    expect(result.found).toBe(false);
    expect(result.tracking).toBeNull();
  });

  it('should return found=false when no tracking number or label ID provided', async () => {
    const result = await useCase.execute({});

    expect(result.found).toBe(false);
  });
});
