import '../../tests/testUtils';
import { CompleteReturnInspectionUseCase } from './CompleteReturnInspection';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';
import { ReturnNotFoundError, InvalidReturnTransitionError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequest } from '../../domain/entities/ReturnRequest';

function makeRepo() {
  const repo = lazyMock<ReturnRequestRepository>();
  repo.update.mockImplementation(async r => r);
  return repo;
}

describe('CompleteReturnInspectionUseCase', () => {
  let repo: jest.Mocked<ReturnRequestRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = makeRepo();
    const received = createReturnRequest();
    received.approve('RMA-1');
    received.markInTransit();
    received.markReceived();
    repo.findById.mockResolvedValue(received);
  });

  it('should mark a received return as inspected and emit return.inspected', async () => {
    const result = await new CompleteReturnInspectionUseCase(repo).execute(
      'r-1',
      { 'item-1': { condition: 'ok' } },
      { 'item-2': { condition: 'damaged' } },
    );

    expect(result.status).toBe('inspected');
    expect(emitMock).toHaveBeenCalledWith(
      'return.inspected',
      expect.objectContaining({
        passedItems: { 'item-1': { condition: 'ok' } },
        failedItems: { 'item-2': { condition: 'damaged' } },
      }),
    );
  });

  it('should throw ReturnNotFoundError when the return does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(new CompleteReturnInspectionUseCase(repo).execute('missing')).rejects.toThrow(ReturnNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should throw ReturnNotFoundError when the update does not persist', async () => {
    repo.update.mockResolvedValue(null as unknown as ReturnRequest);

    await expect(new CompleteReturnInspectionUseCase(repo).execute('r-1')).rejects.toThrow(ReturnNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw InvalidReturnTransitionError when the return has not been received', async () => {
    repo.findById.mockResolvedValue(createReturnRequest());

    await expect(new CompleteReturnInspectionUseCase(repo).execute('r-1')).rejects.toThrow(InvalidReturnTransitionError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
