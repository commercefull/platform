import { PaymentGatewayRepository, PaymentGatewayCreateParams } from '../../domain/repositories/PaymentGatewayRepository';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const paymentRepo = paymentDataRepository.gateways;

export class ManagePaymentGatewaysUseCase {
  constructor(
    private readonly gatewayRepo: PaymentGatewayRepository = paymentRepo,
  ) {}

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
}
