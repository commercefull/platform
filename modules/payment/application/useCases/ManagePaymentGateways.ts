import { PaymentGatewayRepository, PaymentGatewayCreateParams } from '../../domain/repositories/PaymentGatewayRepository';


export class ManagePaymentGatewaysUseCase {
  constructor(private readonly gatewayRepo: PaymentGatewayRepository) {}

  async findAll(organizationId: string) {
    return this.gatewayRepo.findAllGateways(organizationId);
  }
  async findById(gatewayId: string) {
    return this.gatewayRepo.findGatewayById(gatewayId);
  }
  async create(params: PaymentGatewayCreateParams) {
    return this.gatewayRepo.createGateway(params);
  }
  async update(gatewayId: string, updates: Record<string, unknown>) {
    return this.gatewayRepo.updateGateway(gatewayId, updates);
  }
  async delete(gatewayId: string) {
    return this.gatewayRepo.deleteGateway(gatewayId);
  }
  async findAllMethodConfigs(organizationId: string) {
    return this.gatewayRepo.findAllMethodConfigs(organizationId);
  }
  async findMethodConfigById(id: string) {
    return this.gatewayRepo.findMethodConfigById(id);
  }
  async createMethodConfig(params: Parameters<PaymentGatewayRepository['createMethodConfig']>[0]) {
    return this.gatewayRepo.createMethodConfig(params);
  }
  async updateMethodConfig(id: string, params: Parameters<PaymentGatewayRepository['updateMethodConfig']>[1]) {
    return this.gatewayRepo.updateMethodConfig(id, params);
  }
  async deleteMethodConfig(id: string) {
    return this.gatewayRepo.deleteMethodConfig(id);
  }
}
