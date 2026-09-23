import type { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';

export class ManageStorefrontSubscriptionsUseCase {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async findActivePlansWithProduct() {
    return this.subscriptionRepo.findActivePlansWithProduct();
  }
  async findByCustomerIdWithPlan(customerId: string) {
    return this.subscriptionRepo.findByCustomerIdWithPlan(customerId);
  }
  async findByIdWithPlan(subscriptionId: string, customerId: string) {
    return this.subscriptionRepo.findByIdWithPlan(subscriptionId, customerId);
  }
  async findActiveByCustomerId(subscriptionId: string, customerId: string) {
    return this.subscriptionRepo.findActiveByCustomerId(subscriptionId, customerId);
  }
  async cancelSubscription(subscriptionId: string, reason: string) {
    return this.subscriptionRepo.cancelSubscriptionStorefront(subscriptionId, reason);
  }
  async findBillingHistory(subscriptionId: string) {
    return this.subscriptionRepo.findBillingHistory(subscriptionId);
  }
}
