import '../../tests/testUtils';
import { CancelReturnRequestUseCase } from './CancelReturnRequest';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';

function makeRepo() {
  const repo = lazyMock<ReturnRequestRepository>();
  repo.create.mockImplementation(async r => r);
  repo.update.mockImplementation(async r => r);
  return repo;
}

describe('CancelReturnRequestUseCase', () => {
  let repo: jest.Mocked<ReturnRequestRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = makeRepo();
    repo.findById.mockResolvedValue(createReturnRequest());
  });

  it('should cancel a requested return', async () => {
    const result = await new CancelReturnRequestUseCase(repo).execute('r-1');

    expect(result.status).toBe('cancelled');
    expect(emitMock).toHaveBeenCalledWith('return.cancelled', expect.any(Object));
  });
});
