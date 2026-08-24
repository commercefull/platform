import * as subscriptionRepo from '../../infrastructure/repositories/subscriptionRepo';

export class ManageAdminSubscriptionsUseCase {
  async getSubscriptionPlan(id: string) {
    return subscriptionRepo.getSubscriptionPlan(id);
  }
  async getSubscriptionPlans(...args: Parameters<typeof subscriptionRepo.getSubscriptionPlans>) {
    return subscriptionRepo.getSubscriptionPlans(...args);
  }
  async saveSubscriptionPlan(...args: Parameters<typeof subscriptionRepo.saveSubscriptionPlan>) {
    return subscriptionRepo.saveSubscriptionPlan(...args);
  }
  async deleteSubscriptionPlan(id: string) {
    return subscriptionRepo.deleteSubscriptionPlan(id);
  }
  async getCustomerSubscriptions(...args: Parameters<typeof subscriptionRepo.getCustomerSubscriptions>) {
    return subscriptionRepo.getCustomerSubscriptions(...args);
  }
  async updateSubscriptionStatus(...args: Parameters<typeof subscriptionRepo.updateSubscriptionStatus>) {
    return subscriptionRepo.updateSubscriptionStatus(...args);
  }
  async cancelSubscription(...args: Parameters<typeof subscriptionRepo.cancelSubscription>) {
    return subscriptionRepo.cancelSubscription(...args);
  }
  async getSubscriptionOrders(customerSubscriptionId: string) {
    return subscriptionRepo.getSubscriptionOrders(customerSubscriptionId);
  }
  async getCustomerSubscription(id: string) {
    return subscriptionRepo.getCustomerSubscription(id);
  }
  async pauseSubscription(...args: Parameters<typeof subscriptionRepo.pauseSubscription>) {
    return subscriptionRepo.pauseSubscription(...args);
  }
  async getSubscriptionsDueBilling(beforeDate: Date) {
    return subscriptionRepo.getSubscriptionsDueBilling(beforeDate);
  }
  async getSubscriptionOrdersPending() {
    return subscriptionRepo.getSubscriptionOrdersPending();
  }
  async getFailedSubscriptionPayments() {
    return subscriptionRepo.getFailedSubscriptionPayments();
  }
  async advanceBillingCycle(id: string) {
    return subscriptionRepo.advanceBillingCycle(id);
  }
  async createDunningAttempt(...args: Parameters<typeof subscriptionRepo.createDunningAttempt>) {
    return subscriptionRepo.createDunningAttempt(...args);
  }
  async createSubscriptionOrder(...args: Parameters<typeof subscriptionRepo.createSubscriptionOrder>) {
    return subscriptionRepo.createSubscriptionOrder(...args);
  }
  async updateSubscriptionOrderStatus(...args: Parameters<typeof subscriptionRepo.updateSubscriptionOrderStatus>) {
    return subscriptionRepo.updateSubscriptionOrderStatus(...args);
  }
}
