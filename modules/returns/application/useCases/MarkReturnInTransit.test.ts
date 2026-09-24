import '../../tests/testUtils';
import { MarkReturnInTransitUseCase } from './MarkReturnInTransit';
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

  it('should throw ReturnNotFoundError when the return does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(new MarkReturnInTransitUseCase(repo).execute('missing')).rejects.toThrow(ReturnNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should throw ReturnNotFoundError when the update does not persist', async () => {
    const req = createReturnRequest();
    req.approve('RMA-1');
    repo.findById.mockResolvedValue(req);
    repo.update.mockResolvedValue(null as unknown as ReturnRequest);

    await expect(new MarkReturnInTransitUseCase(repo).execute('r-1')).rejects.toThrow(ReturnNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw InvalidReturnTransitionError when the return has not been approved', async () => {
    await expect(new MarkReturnInTransitUseCase(repo).execute('r-1')).rejects.toThrow(InvalidReturnTransitionError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
