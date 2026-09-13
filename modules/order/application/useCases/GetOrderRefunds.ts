import { OrderQueryRepository } from '../../domain/repositories/OrderQueryRepository';
import { orderDataRepository } from '../wired';

const orderQueryRepo = orderDataRepository.queries;

export class GetOrderRefundsUseCase {
  constructor(private readonly queryRepo: OrderQueryRepository = orderQueryRepo) {}

  async findByOrder(orderId: string) {
    return this.queryRepo.findRefundsByOrder(orderId);
  }
}
