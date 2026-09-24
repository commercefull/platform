import type { StoreCreditRepository } from '../../domain/repositories/ReturnRepository';

export class GetStoreCreditLedgerUseCase {
  constructor(private storeCreditRepo: StoreCreditRepository) {}

  async execute(customerId: string, limit?: number) {
    return this.storeCreditRepo.getLedger(customerId, limit);
  }
}

