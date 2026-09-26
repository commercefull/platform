import type { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import type { CheckoutSession } from '../../domain/entities/CheckoutSession';

export class ManageCheckoutSessionUseCase {
  constructor(private readonly checkoutRepo: CheckoutRepository) {}

  async findById(checkoutId: string) {
    return this.checkoutRepo.findById(checkoutId);
  }
  async save(session: CheckoutSession) {
    return this.checkoutRepo.save(session);
  }
  async getAvailablePaymentMethods() {
    return this.checkoutRepo.getAvailablePaymentMethods();
  }
}
