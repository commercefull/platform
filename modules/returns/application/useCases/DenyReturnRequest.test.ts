import '../../tests/testUtils';
import { DenyReturnRequestUseCase } from './DenyReturnRequest';
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

describe('DenyReturnRequestUseCase', () => {
  let repo: jest.Mocked<ReturnRequestRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = makeRepo();
    repo.findById.mockResolvedValue(createReturnRequest());
  });

  it('should deny a requested return and emit return.denied', async () => {
    const result = await new DenyReturnRequestUseCase(repo).execute('r-1', 'out of policy');

    expect(result.status).toBe('denied');
    expect(emitMock).toHaveBeenCalledWith('return.denied', expect.objectContaining({ reason: 'out of policy' }));
  });

  it('should throw ReturnNotFoundError when the return does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(new DenyReturnRequestUseCase(repo).execute('missing')).rejects.toThrow(ReturnNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should throw ReturnNotFoundError when the update does not persist', async () => {
    repo.update.mockResolvedValue(null as unknown as ReturnRequest);

    await expect(new DenyReturnRequestUseCase(repo).execute('r-1')).rejects.toThrow(ReturnNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw InvalidReturnTransitionError when the return is already completed', async () => {
    const req = createReturnRequest();
    req.approve();
    req.markInTransit();
    req.markReceived();
    req.complete();
    repo.findById.mockResolvedValue(req);

    await expect(new DenyReturnRequestUseCase(repo).execute('r-1')).rejects.toThrow(InvalidReturnTransitionError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
