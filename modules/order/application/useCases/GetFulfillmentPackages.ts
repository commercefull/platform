import { OrderFulfillmentPackageRepository } from '../../domain/repositories/OrderFulfillmentPackageRepository';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';

const orderFulfillmentRepo = orderFulfillmentDataRepository.fulfillments;

export class GetFulfillmentPackagesUseCase {
  constructor(
    private readonly packageRepo: OrderFulfillmentPackageRepository = orderFulfillmentRepo,
  ) {}

  async findByOrder(orderId: string) {
    return this.packageRepo.findByOrder(orderId);
  }
}
