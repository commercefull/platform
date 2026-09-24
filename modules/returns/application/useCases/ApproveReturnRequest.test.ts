import '../../tests/testUtils';
import { ApproveReturnRequestUseCase } from './ApproveReturnRequest';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';

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
});
