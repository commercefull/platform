import type {
  ShippingRatePort,
  CreateShippingRateInput,
} from '../../domain/repositories/ShippingConfigPorts';
import type { ShippingRate } from '../../../../libs/db/types';
import { calculateRate } from '../../domain/services/calculateRate';

export class ManageShippingRatesUseCase {
  constructor(private readonly shippingRateRepo: ShippingRatePort) {}

  async findActive(zoneId?: string, methodId?: string) {
    return this.shippingRateRepo.findActive(zoneId, methodId);
  }
  async findById(id: string) {
    return this.shippingRateRepo.findById(id);
  }
  async create(params: CreateShippingRateInput) {
    return this.shippingRateRepo.create(params);
  }
  async update(id: string, updates: Record<string, unknown>) {
    return this.shippingRateRepo.update(id, updates);
  }
  async activate(id: string) {
    return this.shippingRateRepo.activate(id);
  }
  async deactivate(id: string) {
    return this.shippingRateRepo.deactivate(id);
  }
  async delete(id: string) {
    return this.shippingRateRepo.delete(id);
  }
  async findByZoneAndMethod(zoneId: string, methodId: string) {
    return this.shippingRateRepo.findByZoneAndMethod(zoneId, methodId);
  }
  calculateRate(rate: ShippingRate, orderTotal: number, itemCount: number, weight?: number) {
    return calculateRate(rate, orderTotal, itemCount, weight);
  }
}

