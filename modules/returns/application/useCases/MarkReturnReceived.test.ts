import '../../tests/testUtils';
import { MarkReturnReceivedUseCase } from './MarkReturnReceived';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';
import { ReturnNotFoundError, InvalidReturnTransitionError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequest } from '../../domain/entities/ReturnRequest';

function makeRepo() {
  const repo = lazyMock<ReturnRequestRepository>();
  repo.create.mockImplementation(async r => r);
  repo.update.mockImplementation(async r => r);
  return repo;
}

describe('MarkReturnReceivedUseCase', () => {
  let repo: jest.Mocked<ReturnRequestRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = makeRepo();
    repo.findById.mockResolvedValue(createReturnRequest());
  });

  it('should mark an in-transit return as received', async () => {
    const req = createReturnRequest();
    req.approve('RMA-1');
    req.markInTransit();
    repo.findById.mockResolvedValue(req);

    const result = await new MarkReturnReceivedUseCase(repo).execute('r-1');

    expect(result.status).toBe('received');
    expect(emitMock).toHaveBeenCalledWith('return.received', expect.any(Object));
  });

  it('should throw ReturnNotFoundError when the return does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(new MarkReturnReceivedUseCase(repo).execute('missing')).rejects.toThrow(ReturnNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should throw ReturnNotFoundError when the update does not persist', async () => {
    const req = createReturnRequest();
    req.approve();
    req.markInTransit();
    repo.findById.mockResolvedValue(req);
    repo.update.mockResolvedValue(null as unknown as ReturnRequest);

    await expect(new MarkReturnReceivedUseCase(repo).execute('r-1')).rejects.toThrow(ReturnNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw InvalidReturnTransitionError when the return is not in transit', async () => {
    await expect(new MarkReturnReceivedUseCase(repo).execute('r-1')).rejects.toThrow(InvalidReturnTransitionError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
