import { OrderReturnRepository, StorefrontReturnWriter } from '../../domain/repositories/OrderReturnRepository';

export class ManageStorefrontReturnsUseCase {
  constructor(
    private readonly returns: OrderReturnRepository,
    private readonly returnWriter: StorefrontReturnWriter,
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
  async createSimple(orderId: string, customerId: string, reason: string, description?: string) {
    return this.returnWriter.createSimple(orderId, customerId, reason, description);
  }
  async findByIdWithOrderNumber(orderReturnId: string, customerId: string) {
    return this.returns.findByIdWithOrderNumber(orderReturnId, customerId);
  }
}
