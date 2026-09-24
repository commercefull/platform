import type {
  ShippingZonePort,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
} from '../../domain/repositories/ShippingConfigPorts';

export class ManageShippingZonesUseCase {
  constructor(private readonly shippingZoneRepo: ShippingZonePort) {}

  async findById(id: string) {
    return this.shippingZoneRepo.findById(id);
  }
  async findAll(activeOnly?: boolean) {
    return this.shippingZoneRepo.findAll(activeOnly);
  }
  async create(input: CreateShippingZoneInput) {
    return this.shippingZoneRepo.create(input);
  }
  async update(id: string, input: UpdateShippingZoneInput) {
    return this.shippingZoneRepo.update(id, input);
  }
  async activate(id: string) {
    return this.shippingZoneRepo.activate(id);
  }
  async deactivate(id: string) {
    return this.shippingZoneRepo.deactivate(id);
  }
  async deleteZone(id: string) {
    return this.shippingZoneRepo.delete(id);
  }
  async delete(id: string) {
    return this.shippingZoneRepo.delete(id);
  }
}

