import '../../tests/testUtils';
import { MarkReturnReceivedUseCase } from './MarkReturnReceived';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';

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
});
