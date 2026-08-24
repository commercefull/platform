import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const shippingZoneRepo = shippingConfigRepository.zones;
const shippingMethodRepo = shippingConfigRepository.methods;

export class ManageShippingZonesUseCase {
  async findById(id: string) {
    return shippingZoneRepo.findById(id);
  }
  async findAll(activeOnly?: boolean) {
    return shippingZoneRepo.findAll(activeOnly);
  }
  async create(input: Parameters<typeof shippingZoneRepo.create>[0]) {
    return shippingZoneRepo.create(input);
  }
  async update(id: string, input: Parameters<typeof shippingZoneRepo.update>[1]) {
    return shippingZoneRepo.update(id, input);
  }
  async activate(id: string) {
    return shippingZoneRepo.activate(id);
  }
  async deactivate(id: string) {
    return shippingZoneRepo.deactivate(id);
  }
  async deleteZone(id: string) {
    return shippingZoneRepo.delete(id);
  }
  async delete(id: string) {
    return shippingZoneRepo.delete(id);
  }
}

export class ManageShippingMethodsUseCase {
  async findById(id: string) {
    return shippingMethodRepo.findById(id);
  }
  async findAll(activeOnly?: boolean, displayOnFrontend?: boolean) {
    return shippingMethodRepo.findAll(activeOnly, displayOnFrontend);
  }
  async create(input: Parameters<typeof shippingMethodRepo.create>[0]) {
    return shippingMethodRepo.create(input);
  }
  async update(id: string, input: Parameters<typeof shippingMethodRepo.update>[1]) {
    return shippingMethodRepo.update(id, input);
  }
  async activate(id: string) {
    return shippingMethodRepo.activate(id);
  }
  async deactivate(id: string) {
    return shippingMethodRepo.deactivate(id);
  }
  async deleteMethod(id: string) {
    return shippingMethodRepo.delete(id);
  }
  async delete(id: string) {
    return shippingMethodRepo.delete(id);
  }
}
