jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UpdateTrackingUseCase, UpdateTrackingCommand } from './UpdateTracking';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('UpdateTrackingUseCase', () => {
  let useCase: UpdateTrackingUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockFulfillment: Record<string, unknown>;

  beforeEach(() => {
    mockFulfillment = {
      fulfillmentId: 'f1', orderId: 'o1',
      updateTracking: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockFulfillment),
      save: jest.fn().mockImplementation(async (f: unknown) => f),
    };
    useCase = new UpdateTrackingUseCase(mockRepo as never);
  });

  it('should update tracking (happy path)', async () => {
    const result = await useCase.execute(new UpdateTrackingCommand('f1', 'TRK123', 'https://track.url'));

    expect(result.fulfillment.fulfillmentId).toBe('f1');
    expect(mockFulfillment.updateTracking).toHaveBeenCalledWith('TRK123', 'https://track.url');
    expect(eventBus.emit).toHaveBeenCalledWith('fulfillment.tracking_updated', expect.objectContaining({ trackingNumber: 'TRK123' }));
  });

  it('should throw FulfillmentNotFoundError when fulfillment does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateTrackingCommand('missing', 'TRK123'))).rejects.toThrow(FulfillmentNotFoundError);
  });
});
