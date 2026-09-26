import type {
  ShippingCarrierPort,
  ShippingPackagingPort,
  CreateShippingCarrierInput,
  UpdateShippingCarrierInput,
  CreateShippingPackagingTypeInput,
  UpdateShippingPackagingTypeInput,
} from '../../domain/repositories/ShippingConfigPorts';
import type {
  ShippingSurchargeAdminPort,
  CreateShippingSurchargeInput,
  UpdateShippingSurchargeInput,
} from '../../domain/repositories/ShippingSurchargePort';
import { ShippingValidationError } from '../../domain/errors/ShippingErrors';

export class ManageShippingConfigurationUseCase {
  constructor(
    private readonly carrierRepo: ShippingCarrierPort,
    private readonly packagingRepo: ShippingPackagingPort,
    private readonly surchargeRepo: ShippingSurchargeAdminPort,
  ) {}

  async listCarriers(activeOnly?: boolean) {
    return this.carrierRepo.findAll(activeOnly);
  }
  async findCarrierById(id: string) {
    return this.carrierRepo.findById(id);
  }
  async createCarrier(input: CreateShippingCarrierInput) {
    return this.carrierRepo.create(input);
  }
  async updateCarrier(id: string, input: UpdateShippingCarrierInput) {
    return this.carrierRepo.update(id, input);
  }
  async deleteCarrier(id: string) {
    return this.carrierRepo.delete(id);
  }

  async listPackagingTypes(activeOnly?: boolean) {
    return this.packagingRepo.findAll(activeOnly);
  }
  async findPackagingTypeById(id: string) {
    return this.packagingRepo.findById(id);
  }
  async createPackagingType(input: CreateShippingPackagingTypeInput) {
    return this.packagingRepo.create(input);
  }
  async updatePackagingType(id: string, input: UpdateShippingPackagingTypeInput) {
    return this.packagingRepo.update(id, input);
  }
  async deletePackagingType(id: string) {
    return this.packagingRepo.delete(id);
  }

  async listSurchargesByRate(shippingRateId: string, activeOnly?: boolean) {
    return this.surchargeRepo.findByRateId(shippingRateId, activeOnly);
  }
  async findSurchargeById(id: string) {
    return this.surchargeRepo.findById(id);
  }
  async createSurcharge(input: CreateShippingSurchargeInput) {
    if (!input.shippingRateId || !input.type || !input.calculationType || input.value === undefined) {
      throw new ShippingValidationError('Missing required fields: shippingRateId, type, calculationType, value');
    }
    return this.surchargeRepo.create(input);
  }
  async updateSurcharge(id: string, input: UpdateShippingSurchargeInput) {
    return this.surchargeRepo.update(id, input);
  }
  async deleteSurcharge(id: string) {
    return this.surchargeRepo.delete(id);
  }
}
