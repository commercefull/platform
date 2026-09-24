import { StoreCreditLedgerEntry } from '../../domain/entities/StoreCredit';
import { InsufficientStoreCreditError } from '../../domain/errors/ReturnErrors';
import type { StoreCreditRepository } from '../../domain/repositories/ReturnRepository';

export class DebitStoreCreditUseCase {
  constructor(private storeCreditRepo: StoreCreditRepository) {}

  async execute(params: {
    customerId: string;
    amountCents: number;
    referenceType?: string;
    referenceId?: string;
    reason?: string;
  }): Promise<StoreCreditLedgerEntry> {
    const balanceCents = await this.storeCreditRepo.getBalance(params.customerId);

    if (balanceCents.balanceCents < params.amountCents) {
      throw new InsufficientStoreCreditError(params.customerId, params.amountCents, balanceCents.balanceCents);
    }

    const newBalance = balanceCents.balanceCents - params.amountCents;
    const entry = StoreCreditLedgerEntry.create({
      customerId: params.customerId,
      entryType: 'debit',
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      amountCents: params.amountCents,
      balanceAfterCents: newBalance,
      reason: params.reason ?? 'Store credit debit',
    });

    return this.storeCreditRepo.addEntry(entry);
  }
}
