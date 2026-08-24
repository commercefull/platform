jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ProcessPackingUseCase, ProcessPackingCommand } from './ProcessPacking';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ProcessPackingUseCase', () => {
  let useCase: ProcessPackingUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockFulfillment: Record<string, unknown>;

  beforeEach(() => {
    mockFulfillment = {
      fulfillmentId: 'f1', orderId: 'o1', status: 'picking_complete',
      startPacking: jest.fn(), completePacking: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockFulfillment),
      save: jest.fn().mockImplementation(async (f: unknown) => f),
    };
    useCase = new ProcessPackingUseCase(mockRepo as never);
  });

  it('should start packing (happy path)', async () => {
    const result = await useCase.execute(new ProcessPackingCommand('f1'));

    expect(result.fulfillment.fulfillmentId).toBe('f1');
    expect(mockFulfillment.startPacking).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('fulfillment.packing_started', expect.objectContaining({ fulfillmentId: 'f1' }));
  });

  it('should complete packing when flag is set', async () => {
    const _result = await useCase.execute(new ProcessPackingCommand('f1', true, 2.5, { length: 10, width: 5, height: 3 }));

    expect(mockFulfillment.completePacking).toHaveBeenCalledWith(2.5, { length: 10, width: 5, height: 3 });
    expect(eventBus.emit).toHaveBeenCalledWith('fulfillment.packing_completed', expect.objectContaining({ fulfillmentId: 'f1' }));
  });

  it('should throw FulfillmentNotFoundError when fulfillment not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ProcessPackingCommand('missing'))).rejects.toThrow(FulfillmentNotFoundError);
  });
});
