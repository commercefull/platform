import type { SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';

export class ManageAdminSubscriptionsUseCase {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async getSubscriptionProduct(id: string) {
    return this.subscriptionRepo.getSubscriptionProduct(id);
  }
  async getSubscriptionProducts(activeOnly?: boolean) {
    return this.subscriptionRepo.getSubscriptionProducts(activeOnly);
  }
  async saveSubscriptionProduct(...args: Parameters<SubscriptionRepository['saveSubscriptionProduct']>) {
    return this.subscriptionRepo.saveSubscriptionProduct(...args);
  }
  async deleteSubscriptionProduct(id: string) {
    return this.subscriptionRepo.deleteSubscriptionProduct(id);
  }
  async getSubscriptionPlan(id: string) {
    return this.subscriptionRepo.getSubscriptionPlan(id);
  }
  async getSubscriptionPlans(...args: Parameters<SubscriptionRepository['getSubscriptionPlans']>) {
    return this.subscriptionRepo.getSubscriptionPlans(...args);
  }
  async saveSubscriptionPlan(...args: Parameters<SubscriptionRepository['saveSubscriptionPlan']>) {
    return this.subscriptionRepo.saveSubscriptionPlan(...args);
  }
  async deleteSubscriptionPlan(id: string) {
    return this.subscriptionRepo.deleteSubscriptionPlan(id);
  }
  async getCustomerSubscriptions(...args: Parameters<SubscriptionRepository['getCustomerSubscriptions']>) {
    return this.subscriptionRepo.getCustomerSubscriptions(...args);
  }
  async updateSubscriptionStatus(...args: Parameters<SubscriptionRepository['updateSubscriptionStatus']>) {
    return this.subscriptionRepo.updateSubscriptionStatus(...args);
  }
  async cancelSubscription(...args: Parameters<SubscriptionRepository['cancelSubscription']>) {
    return this.subscriptionRepo.cancelSubscription(...args);
  }
  async getSubscriptionOrders(customerSubscriptionId: string) {
    return this.subscriptionRepo.getSubscriptionOrders(customerSubscriptionId);
  }
  async getCustomerSubscription(id: string) {
    return this.subscriptionRepo.getCustomerSubscription(id);
  }
  async pauseSubscription(...args: Parameters<SubscriptionRepository['pauseSubscription']>) {
    return this.subscriptionRepo.pauseSubscription(...args);
  }
  async resumeSubscription(...args: Parameters<SubscriptionRepository['resumeSubscription']>) {
    return this.subscriptionRepo.resumeSubscription(...args);
  }
  async getDunningAttempts(customerSubscriptionId: string) {
    return this.subscriptionRepo.getDunningAttempts(customerSubscriptionId);
  }
  async getPendingDunningAttempts(beforeDate: Date) {
    return this.subscriptionRepo.getPendingDunningAttempts(beforeDate);
  }
  async getSubscriptionsDueBilling(beforeDate: Date) {
    return this.subscriptionRepo.getSubscriptionsDueBilling(beforeDate);
  }
  async getSubscriptionOrdersPending() {
    return this.subscriptionRepo.getSubscriptionOrdersPending();
  }
  async getFailedSubscriptionPayments() {
    return this.subscriptionRepo.getFailedSubscriptionPayments();
  }
  async advanceBillingCycle(id: string) {
    return this.subscriptionRepo.advanceBillingCycle(id);
  }
  async createDunningAttempt(...args: Parameters<SubscriptionRepository['createDunningAttempt']>) {
    return this.subscriptionRepo.createDunningAttempt(...args);
  }
  async createSubscriptionOrder(...args: Parameters<SubscriptionRepository['createSubscriptionOrder']>) {
    return this.subscriptionRepo.createSubscriptionOrder(...args);
  }
  async updateSubscriptionOrderStatus(...args: Parameters<SubscriptionRepository['updateSubscriptionOrderStatus']>) {
    return this.subscriptionRepo.updateSubscriptionOrderStatus(...args);
  }
}
