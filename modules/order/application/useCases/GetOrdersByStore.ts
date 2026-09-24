import { OrderRepository, OrderFilters } from '../../domain/repositories/OrderRepository';


export class GetOrdersByStoreUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(storeId: string, limit = 10, offset = 0) {
    const result = await this.orders.findAll({ storeId } as OrderFilters, { limit, offset, orderBy: 'createdAt', orderDirection: 'desc' });
    return result;
  }
}
