import '../../tests/testUtils';
import { ShipOrderUseCase } from './ShipOrder';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import {
  createFulfillmentRepository,
  createFulfillment,
  emitFulfillmentShippedMock,
} from '../../tests/testUtils';

describe('ShipOrderUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new ShipOrderUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    fulfillmentRepository.save.mockImplementation(async (f) => f);
  });

  it('should ship a packed fulfillment with tracking details', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('packed'));

    const result = await useCase.execute({
      fulfillmentId: 'ful-1',
      trackingNumber: 'TRK-123',
      carrierId: 'fedex',
      carrierName: 'FedEx',
    });

    expect(result.fulfillment.status).toBe('shipped');
    expect(result.fulfillment.trackingNumber).toBe('TRK-123');
    expect(result.fulfillment.carrierName).toBe('FedEx');
  });

  it('should ship a fulfillment that is ready to ship', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('ready_to_ship'));

    const result = await useCase.execute({ fulfillmentId: 'ful-1', trackingNumber: 'TRK-456' });

    expect(result.fulfillment.status).toBe('shipped');
  });

  it('should throw FulfillmentNotFoundError when the fulfillment does not exist', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ fulfillmentId: 'ful-x', trackingNumber: 'TRK-1' })).rejects.toThrow(
      FulfillmentNotFoundError,
    );
    expect(emitFulfillmentShippedMock).not.toHaveBeenCalled();
  });

  it('should emit fulfillment.shipped with the tracking details', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('packed'));

    await useCase.execute({
      fulfillmentId: 'ful-1',
      trackingNumber: 'TRK-123',
      trackingUrl: 'https://track.example.com/TRK-123',
      carrierName: 'FedEx',
    });

    expect(emitFulfillmentShippedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fulfillmentId: 'ful-1',
        orderId: 'ord-1',
        trackingNumber: 'TRK-123',
        trackingUrl: 'https://track.example.com/TRK-123',
        carrierName: 'FedEx',
      }),
    );
  });

  it('should persist the fulfillment after shipping', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('packed'));

    await useCase.execute({ fulfillmentId: 'ful-1', trackingNumber: 'TRK-123' });

    expect(fulfillmentRepository.save).toHaveBeenCalledTimes(1);
  });
});
