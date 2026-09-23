import type { ShippingZonePort } from '../../domain/repositories/ShippingConfigPorts';

export class ManageShippingZonesLookupUseCase {
  constructor(private readonly shippingZoneRepo: Pick<ShippingZonePort, 'findAll' | 'findById'>) {}

  async findAll() {
    return this.shippingZoneRepo.findAll();
  }
  async findById(id: string) {
    return this.shippingZoneRepo.findById(id);
  }
}
