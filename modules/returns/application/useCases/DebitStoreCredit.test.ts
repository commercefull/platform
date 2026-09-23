import '../../tests/testUtils';
import { DebitStoreCreditUseCase } from './DebitStoreCredit';
import { InsufficientStoreCreditError } from '../../domain/errors/ReturnErrors';
import type { StoreCreditRepository } from '../../domain/repositories/ReturnRepository';
import { lazyMock } from '../../tests/testUtils';

describe('DebitStoreCreditUseCase', () => {
  it('should debit the balance when sufficient credit exists', async () => {
    const repo = lazyMock<StoreCreditRepository>();
    repo.getBalance.mockResolvedValue({ customerId: 'c-1', balance: 100, currency: 'USD', totalCredits: 100, totalDebits: 0, pendingExpiry: 0, lastEntryAt: null });
    repo.addEntry.mockImplementation(async e => e);

    const result = await new DebitStoreCreditUseCase(repo).execute({ customerId: 'c-1', amount: 40 });

    expect(result.balanceAfter).toBe(60);
  });

  it('should throw InsufficientStoreCreditError when the balance is too low', async () => {
    const repo = lazyMock<StoreCreditRepository>();
    repo.getBalance.mockResolvedValue({ customerId: 'c-1', balance: 10, currency: 'USD', totalCredits: 10, totalDebits: 0, pendingExpiry: 0, lastEntryAt: null });

    await expect(new DebitStoreCreditUseCase(repo).execute({ customerId: 'c-1', amount: 40 }))
      .rejects.toThrow(InsufficientStoreCreditError);
  });
});
