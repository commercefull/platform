import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const shippingRateRepo = shippingConfigRepository.rates;
const shippingZoneRepo = shippingConfigRepository.zones;
const shippingMethodRepo = shippingConfigRepository.methods;

export class ManageShippingRatesUseCase {
  async findActive(zoneId?: string, methodId?: string) {
    return shippingRateRepo.findActive(zoneId, methodId);
  }
  async findById(id: string) {
    return shippingRateRepo.findById(id);
  }
  async create(params: Parameters<typeof shippingRateRepo.create>[0]) {
    return shippingRateRepo.create(params);
  }
  async update(id: string, updates: Record<string, unknown>) {
    return shippingRateRepo.update(id, updates);
  }
  async activate(id: string) {
    return shippingRateRepo.activate(id);
  }
  async deactivate(id: string) {
    return shippingRateRepo.deactivate(id);
  }
  async delete(id: string) {
    return shippingRateRepo.delete(id);
  }
  async findByZoneAndMethod(zoneId: string, methodId: string) {
    return shippingRateRepo.findByZoneAndMethod(zoneId, methodId);
  }
  calculateRate(rate: Parameters<typeof shippingRateRepo.calculateRate>[0], orderTotal: number, itemCount: number, weight?: number) {
    return shippingRateRepo.calculateRate(rate, orderTotal, itemCount, weight);
  }
}

export class ManageShippingZonesUseCase {
  async findAll() {
    return shippingZoneRepo.findAll();
  }
  async findById(id: string) {
    return shippingZoneRepo.findById(id);
  }
}

export class ManageShippingMethodsAdminUseCase {
  async findAll() {
    return shippingMethodRepo.findAll();
  }
  async findById(id: string) {
    return shippingMethodRepo.findById(id);
  }
}
