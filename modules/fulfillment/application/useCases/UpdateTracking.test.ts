import '../../tests/testUtils';
import { UpdateTrackingUseCase, UpdateTrackingCommand } from './UpdateTracking';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { createFulfillmentRepository, createFulfillment, emitMock } from '../../tests/testUtils';

describe('UpdateTrackingUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new UpdateTrackingUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    fulfillmentRepository.save.mockImplementation(async (f) => f);
  });

  it('should update tracking details and emit fulfillment.tracking_updated', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('shipped'));

    const result = await useCase.execute(new UpdateTrackingCommand('ful-1', 'TRK123', 'https://track.url'));

    expect(result.fulfillment.fulfillmentId).toBe('ful-1');
    expect(result.fulfillment.trackingNumber).toBe('TRK123');
    expect(result.fulfillment.trackingUrl).toBe('https://track.url');
    expect(emitMock).toHaveBeenCalledWith(
      'fulfillment.tracking_updated',
      expect.objectContaining({ trackingNumber: 'TRK123' }),
    );
  });

  it('should throw FulfillmentNotFoundError when the fulfillment does not exist', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateTrackingCommand('missing', 'TRK123'))).rejects.toThrow(
      FulfillmentNotFoundError,
    );
    expect(emitMock).not.toHaveBeenCalled();
  });
});
