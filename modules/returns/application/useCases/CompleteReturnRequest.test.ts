import '../../tests/testUtils';
import { CompleteReturnRequestUseCase } from './CompleteReturnRequest';
import type { ReturnRequestRepository, StoreCreditRepository } from '../../domain/repositories/ReturnRepository';
import { createReturnRequest, emitMock, lazyMock } from '../../tests/testUtils';
import { ReturnNotFoundError, InvalidReturnTransitionError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequest } from '../../domain/entities/ReturnRequest';
import type { CustomerStoreCreditBalance } from '../../domain/entities/StoreCredit';

function makeRepos() {
  const returnRepo = lazyMock<ReturnRequestRepository>();
  returnRepo.update.mockImplementation(async r => r);
  const storeCreditRepo = lazyMock<StoreCreditRepository>();
  storeCreditRepo.getBalance.mockResolvedValue({
    customerId: 'cust-1',
    balanceCents: 1000,
    currency: 'USD',
    totalCreditsCents: 1000,
    totalDebitsCents: 0,
    pendingExpiryCents: 0,
    lastEntryAt: null,
  } satisfies CustomerStoreCreditBalance);
  storeCreditRepo.addEntry.mockImplementation(async e => e);
  return { returnRepo, storeCreditRepo };
}

function receivedReturn(overrides: Parameters<typeof createReturnRequest>[0] = {}) {
  const req = createReturnRequest(overrides);
  req.approve('RMA-1');
  req.markInTransit();
  req.markReceived();
  return req;
}

describe('CompleteReturnRequestUseCase', () => {
  let returnRepo: jest.Mocked<ReturnRequestRepository>;
  let storeCreditRepo: jest.Mocked<StoreCreditRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    ({ returnRepo, storeCreditRepo } = makeRepos());
    returnRepo.findById.mockResolvedValue(receivedReturn());
  });

  it('should complete a received return and emit return.completed', async () => {
    const result = await new CompleteReturnRequestUseCase(returnRepo, storeCreditRepo).execute('r-1');

    expect(result.status).toBe('completed');
    expect(emitMock).toHaveBeenCalledWith('return.completed', expect.objectContaining({ returnType: 'refund' }));
    expect(storeCreditRepo.addEntry).not.toHaveBeenCalled();
  });

  it('should credit the customer balance when the return type is storeCredit', async () => {
    returnRepo.findById.mockResolvedValue(receivedReturn({ returnType: 'storeCredit' }));

    const result = await new CompleteReturnRequestUseCase(returnRepo, storeCreditRepo).execute('r-1');

    expect(result.status).toBe('completed');
    expect(storeCreditRepo.getBalance).toHaveBeenCalledWith('cust-1');
    expect(storeCreditRepo.addEntry).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1', entryType: 'credit', referenceType: 'return' }),
    );
  });

  it('should throw ReturnNotFoundError when the return does not exist', async () => {
    returnRepo.findById.mockResolvedValue(null);

    await expect(new CompleteReturnRequestUseCase(returnRepo, storeCreditRepo).execute('missing')).rejects.toThrow(
      ReturnNotFoundError,
    );
    expect(returnRepo.update).not.toHaveBeenCalled();
  });

  it('should throw ReturnNotFoundError when the update does not persist', async () => {
    returnRepo.update.mockResolvedValue(null as unknown as ReturnRequest);

    await expect(new CompleteReturnRequestUseCase(returnRepo, storeCreditRepo).execute('r-1')).rejects.toThrow(
      ReturnNotFoundError,
    );
    expect(emitMock).not.toHaveBeenCalled();
    expect(storeCreditRepo.addEntry).not.toHaveBeenCalled();
  });

  it('should throw InvalidReturnTransitionError when the return has not been received', async () => {
    returnRepo.findById.mockResolvedValue(createReturnRequest());

    await expect(new CompleteReturnRequestUseCase(returnRepo, storeCreditRepo).execute('r-1')).rejects.toThrow(
      InvalidReturnTransitionError,
    );
    expect(returnRepo.update).not.toHaveBeenCalled();
  });
});
