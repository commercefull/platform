import { OrderRepository, OrderFilters } from '../../domain/repositories/OrderRepository';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const orderRepo = orderDataRepository.commands;

export class GetOrdersByStoreUseCase {
  constructor(
    private readonly orders: OrderRepository = orderRepo,
  ) {}

  async execute(storeId: string, limit = 10, offset = 0) {
    const result = await this.orders.findAll(
      { storeId } as OrderFilters,
      { limit, offset, orderBy: 'createdAt', orderDirection: 'desc' },
    );
    return result;
  }
}
