import * as subscriptionRepo from '../../infrastructure/repositories/subscriptionRepo';

export class ManageStorefrontSubscriptionsUseCase {
  async findActivePlansWithProduct() {
    return subscriptionRepo.findActivePlansWithProduct();
  }
  async findByCustomerIdWithPlan(customerId: string) {
    return subscriptionRepo.findByCustomerIdWithPlan(customerId);
  }
  async findByIdWithPlan(subscriptionId: string, customerId: string) {
    return subscriptionRepo.findByIdWithPlan(subscriptionId, customerId);
  }
  async findActiveByCustomerId(subscriptionId: string, customerId: string) {
    return subscriptionRepo.findActiveByCustomerId(subscriptionId, customerId);
  }
  async cancelSubscription(subscriptionId: string, reason: string) {
    return subscriptionRepo.cancelSubscriptionStorefront(subscriptionId, reason);
  }
  async findBillingHistory(subscriptionId: string) {
    return subscriptionRepo.findBillingHistory(subscriptionId);
  }
}
