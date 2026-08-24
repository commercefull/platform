import type { BasketRepository } from '../../domain/repositories/BasketRepository';

export class ManageAdminBasketUseCase {
  constructor(private readonly repo: BasketRepository) {}

  async findAbandonedBaskets(olderThanDays: number) {
    return this.repo.findAbandonedBaskets(olderThanDays);
  }
  async findExpiredBaskets() {
    return this.repo.findExpiredBaskets();
  }
  async findById(basketId: string) {
    return this.repo.findById(basketId);
  }
  async delete(basketId: string) {
    return this.repo.delete(basketId);
  }
}
