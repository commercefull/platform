import '../../tests/testUtils';
import { ApproveReturnRequestUseCase } from './ApproveReturnRequest';
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

describe('ApproveReturnRequestUseCase', () => {
  let repo: jest.Mocked<ReturnRequestRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = makeRepo();
    repo.findById.mockResolvedValue(createReturnRequest());
  });

  it('should approve a requested return and emit return.approved', async () => {
    const result = await new ApproveReturnRequestUseCase(repo).execute('r-1', 'RMA-1');

    expect(result.status).toBe('approved');
    expect(emitMock).toHaveBeenCalledWith('return.approved', expect.objectContaining({ rmaNumber: 'RMA-1' }));
  });

  it('should throw ReturnNotFoundError when the return does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(new ApproveReturnRequestUseCase(repo).execute('missing')).rejects.toThrow(ReturnNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should throw ReturnNotFoundError when the update does not persist', async () => {
    repo.update.mockResolvedValue(null as unknown as ReturnRequest);

    await expect(new ApproveReturnRequestUseCase(repo).execute('r-1')).rejects.toThrow(ReturnNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw InvalidReturnTransitionError when the return is already approved', async () => {
    const req = createReturnRequest();
    req.approve();
    repo.findById.mockResolvedValue(req);

    await expect(new ApproveReturnRequestUseCase(repo).execute('r-1')).rejects.toThrow(InvalidReturnTransitionError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
