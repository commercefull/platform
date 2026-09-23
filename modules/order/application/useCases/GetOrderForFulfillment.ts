import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class GetOrderForFulfillmentUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async findById(id: string) {
    return this.orders.findById(id);
  }
}
