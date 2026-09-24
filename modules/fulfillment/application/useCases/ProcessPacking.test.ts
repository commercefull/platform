import '../../tests/testUtils';
import { ProcessPackingUseCase, ProcessPackingCommand } from './ProcessPacking';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { createFulfillmentRepository, createFulfillment, emitMock } from '../../tests/testUtils';

describe('ProcessPackingUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new ProcessPackingUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    fulfillmentRepository.save.mockImplementation(async (f) => f);
  });

  it('should start packing a picked fulfillment and emit fulfillment.packing_started', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('picked'));

    const result = await useCase.execute(new ProcessPackingCommand('ful-1'));

    expect(result.fulfillment.status).toBe('packing');
    expect(emitMock).toHaveBeenCalledWith(
      'fulfillment.packing_started',
      expect.objectContaining({ fulfillmentId: 'ful-1' }),
    );
  });

  it('should complete packing with weight and dimensions when the flag is set', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('picked'));

    const result = await useCase.execute(
      new ProcessPackingCommand('ful-1', true, 2.5, { length: 10, width: 5, height: 3 }),
    );

    expect(result.fulfillment.status).toBe('packed');
    expect(emitMock).toHaveBeenCalledWith(
      'fulfillment.packing_completed',
      expect.objectContaining({ fulfillmentId: 'ful-1' }),
    );
  });

  it('should throw FulfillmentNotFoundError when the fulfillment does not exist', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ProcessPackingCommand('missing'))).rejects.toThrow(FulfillmentNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
