import '../../tests/testUtils';
import { MarkReturnInTransitUseCase } from './MarkReturnInTransit';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';

function makeRepo() {
  const repo = lazyMock<ReturnRequestRepository>();
  repo.create.mockImplementation(async r => r);
  repo.update.mockImplementation(async r => r);
  return repo;
}

describe('MarkReturnInTransitUseCase', () => {
  let repo: jest.Mocked<ReturnRequestRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = makeRepo();
    repo.findById.mockResolvedValue(createReturnRequest());
  });

  it('should mark an approved return in transit and emit return.in_transit', async () => {
    const req = createReturnRequest();
    req.approve('RMA-1');
    repo.findById.mockResolvedValue(req);

    const result = await new MarkReturnInTransitUseCase(repo).execute('r-1', 'TRK-1');

    expect(result.status).toBe('inTransit');
    expect(emitMock).toHaveBeenCalledWith('return.in_transit', expect.objectContaining({ trackingNumber: 'TRK-1' }));
  });
});
