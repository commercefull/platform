jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { MarkDeliveredUseCase} from './MarkDelivered';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';

jest.mock('../../domain/events/FulfillmentEvents', () => ({
  emitFulfillmentDelivered: jest.fn(),
}));

import { emitFulfillmentDelivered } from '../../domain/events/FulfillmentEvents';

describe('MarkDeliveredUseCase', () => {
  let useCase: MarkDeliveredUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockFulfillment: Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFulfillment = {
      fulfillmentId: 'f1', orderId: 'o1', deliveredAt: new Date(),
      markDelivered: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockFulfillment),
      save: jest.fn().mockImplementation(async (f: unknown) => f),
    };
    useCase = new MarkDeliveredUseCase(mockRepo as never);
  });

  it('should mark fulfillment as delivered (happy path)', async () => {
    const result = await useCase.execute({ fulfillmentId: 'f1' });

    expect(result.fulfillment.fulfillmentId).toBe('f1');
    expect(mockFulfillment.markDelivered).toHaveBeenCalled();
    expect(emitFulfillmentDelivered).toHaveBeenCalledWith(expect.objectContaining({ fulfillmentId: 'f1' }));
  });

  it('should throw FulfillmentNotFoundError when fulfillment does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ fulfillmentId: 'missing' })).rejects.toThrow(FulfillmentNotFoundError);
  });
});
