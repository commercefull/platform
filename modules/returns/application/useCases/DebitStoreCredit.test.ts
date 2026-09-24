import '../../tests/testUtils';
import { DebitStoreCreditUseCase } from './DebitStoreCredit';
import { InsufficientStoreCreditError } from '../../domain/errors/ReturnErrors';
import type { StoreCreditRepository } from '../../domain/repositories/ReturnRepository';
import { lazyMock } from '../../tests/testUtils';

describe('DebitStoreCreditUseCase', () => {
  it('should debit the balanceCents when sufficient credit exists', async () => {
    const repo = lazyMock<StoreCreditRepository>();
    repo.getBalance.mockResolvedValue({ customerId: 'c-1', balanceCents: 100, currency: 'USD', totalCreditsCents: 100, totalDebitsCents: 0, pendingExpiryCents: 0, lastEntryAt: null });
    repo.addEntry.mockImplementation(async e => e);

    const result = await new DebitStoreCreditUseCase(repo).execute({ customerId: 'c-1', amountCents: 40 });

    expect(result.balanceAfterCents).toBe(60);
  });

  it('should throw InsufficientStoreCreditError when the balanceCents is too low', async () => {
    const repo = lazyMock<StoreCreditRepository>();
    repo.getBalance.mockResolvedValue({ customerId: 'c-1', balanceCents: 10, currency: 'USD', totalCreditsCents: 10, totalDebitsCents: 0, pendingExpiryCents: 0, lastEntryAt: null });

    await expect(new DebitStoreCreditUseCase(repo).execute({ customerId: 'c-1', amountCents: 40 }))
      .rejects.toThrow(InsufficientStoreCreditError);
  });
});
