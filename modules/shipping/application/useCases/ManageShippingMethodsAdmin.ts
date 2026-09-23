import type { ShippingMethodPort } from '../../domain/repositories/ShippingConfigPorts';

export class ManageShippingMethodsAdminUseCase {
  constructor(private readonly shippingMethodRepo: Pick<ShippingMethodPort, 'findAll' | 'findById'>) {}

  async findAll() {
    return this.shippingMethodRepo.findAll();
  }
  async findById(id: string) {
    return this.shippingMethodRepo.findById(id);
  }
}
