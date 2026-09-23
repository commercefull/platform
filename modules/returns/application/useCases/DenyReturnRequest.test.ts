import '../../tests/testUtils';
import { DenyReturnRequestUseCase } from './DenyReturnRequest';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';

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
});
