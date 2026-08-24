import { OrderReturnRepository } from '../../domain/repositories/OrderReturnRepository';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';

const orderReturnRepo = orderFulfillmentDataRepository.returns;

export class ManageStorefrontReturnsUseCase {
  constructor(
    private readonly returns: OrderReturnRepository = orderReturnRepo,
  ) {}

  async findByCustomerIdWithOrderNumber(customerId: string) {
    return this.returns.findByCustomerIdWithOrderNumber(customerId);
  }
  async findOrderForCustomer(orderId: string, customerId: string) {
    return this.returns.findOrderForCustomer(orderId, customerId);
  }
  async findOrderItemsWithProduct(orderId: string) {
    return this.returns.findOrderItemsWithProduct(orderId);
  }
  async createSimple(orderId: string, reason: string, description?: string) {
    return this.returns.createSimple(orderId, reason, description);
  }
  async findByIdWithOrderNumber(orderReturnId: string, customerId: string) {
    return this.returns.findByIdWithOrderNumber(orderReturnId, customerId);
  }
}
