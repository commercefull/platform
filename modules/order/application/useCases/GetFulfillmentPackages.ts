import { OrderFulfillmentPackageRepository } from '../../domain/repositories/OrderFulfillmentPackageRepository';


export class GetFulfillmentPackagesUseCase {
  constructor(private readonly packageRepo: OrderFulfillmentPackageRepository) {}

  async findByOrder(orderId: string) {
    return this.packageRepo.findByOrder(orderId);
  }
}
