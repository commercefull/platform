import type { OrderRepository, OrderFilters } from '../../domain/repositories/OrderRepository';

type OrderHistoryPort = Pick<
  OrderRepository,
  'getOrderStats' | 'getStatusHistory' | 'getPaymentStatusHistory' | 'getFulfillmentStatusHistory'
>;

export class GetOrderHistoryUseCase {
  constructor(private readonly orderRepo: OrderHistoryPort) {}

  async getStats(filters?: OrderFilters) {
    return this.orderRepo.getOrderStats(filters);
  }

  async getStatusHistory(orderId: string) {
    return this.orderRepo.getStatusHistory(orderId);
  }

  async getPaymentStatusHistory(orderId: string) {
    return this.orderRepo.getPaymentStatusHistory(orderId);
  }

  async getFulfillmentStatusHistory(orderId: string) {
    return this.orderRepo.getFulfillmentStatusHistory(orderId);
  }
}
