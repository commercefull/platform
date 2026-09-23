import { StoreCreditLedgerEntry } from '../../domain/entities/StoreCredit';
import { InsufficientStoreCreditError } from '../../domain/errors/ReturnErrors';
import type { StoreCreditRepository } from '../../domain/repositories/ReturnRepository';

export class DebitStoreCreditUseCase {
  constructor(private storeCreditRepo: StoreCreditRepository) {}

  async execute(params: {
    customerId: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    reason?: string;
  }): Promise<StoreCreditLedgerEntry> {
    const balance = await this.storeCreditRepo.getBalance(params.customerId);

    if (balance.balance < params.amount) {
      throw new InsufficientStoreCreditError(params.customerId, params.amount, balance.balance);
    }

    const newBalance = balance.balance - params.amount;
    const entry = StoreCreditLedgerEntry.create({
      customerId: params.customerId,
      entryType: 'debit',
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      amount: params.amount,
      balanceAfter: newBalance,
      reason: params.reason ?? 'Store credit debit',
    });

    return this.storeCreditRepo.addEntry(entry);
  }
}
