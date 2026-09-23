import type { StoreCreditRepository } from '../../domain/repositories/ReturnRepository';

export class GetStoreCreditBalanceUseCase {
  constructor(private storeCreditRepo: StoreCreditRepository) {}

  async execute(customerId: string) {
    return this.storeCreditRepo.getBalance(customerId);
  }
}

