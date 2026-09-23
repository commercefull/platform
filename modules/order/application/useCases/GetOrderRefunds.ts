import { OrderQueryRepository } from '../../domain/repositories/OrderQueryRepository';


export class GetOrderRefundsUseCase {
  constructor(private readonly queryRepo: OrderQueryRepository) {}

  async findByOrder(orderId: string) {
    return this.queryRepo.findRefundsByOrder(orderId);
  }
}
