import type {
  ShippingMethodPort,
  CreateShippingMethodInput,
  UpdateShippingMethodInput,
} from '../../domain/repositories/ShippingConfigPorts';

export class ManageShippingMethodsUseCase {
  constructor(private readonly shippingMethodRepo: ShippingMethodPort) {}

  async findById(id: string) {
    return this.shippingMethodRepo.findById(id);
  }
  async findAll(activeOnly?: boolean, displayOnFrontend?: boolean) {
    return this.shippingMethodRepo.findAll(activeOnly, displayOnFrontend);
  }
  async create(input: CreateShippingMethodInput) {
    return this.shippingMethodRepo.create(input);
  }
  async update(id: string, input: UpdateShippingMethodInput) {
    return this.shippingMethodRepo.update(id, input);
  }
  async activate(id: string) {
    return this.shippingMethodRepo.activate(id);
  }
  async deactivate(id: string) {
    return this.shippingMethodRepo.deactivate(id);
  }
  async deleteMethod(id: string) {
    return this.shippingMethodRepo.delete(id);
  }
  async delete(id: string) {
    return this.shippingMethodRepo.delete(id);
  }
}
