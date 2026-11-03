import { PaymentGateway, PaymentMethodConfig } from '../entities/PaymentModel';

export type PaymentGatewayCreateParams = Omit<PaymentGateway, 'paymentGatewayId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentGatewayUpdateParams = Partial<PaymentGatewayCreateParams>;

export type PaymentMethodConfigCreateParams = Omit<PaymentMethodConfig, 'paymentMethodConfigId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentMethodConfigUpdateParams = Partial<PaymentMethodConfigCreateParams>;

export interface PaymentGatewayRepository {
  // Gateways
  findAllGateways(organizationId: string): Promise<PaymentGateway[]>;
  findGatewayById(id: string): Promise<PaymentGateway | null>;
  createGateway(params: PaymentGatewayCreateParams): Promise<PaymentGateway>;
  updateGateway(id: string, params: PaymentGatewayUpdateParams): Promise<PaymentGateway>;
  deleteGateway(id: string): Promise<boolean>;

  // Method configs
  findAllMethodConfigs(organizationId: string): Promise<PaymentMethodConfig[]>;
  findMethodConfigById(id: string): Promise<PaymentMethodConfig | null>;
  findEnabledMethodConfigs(organizationId: string): Promise<PaymentMethodConfig[]>;
  createMethodConfig(params: PaymentMethodConfigCreateParams): Promise<PaymentMethodConfig>;
  updateMethodConfig(id: string, params: PaymentMethodConfigUpdateParams): Promise<PaymentMethodConfig>;
  deleteMethodConfig(id: string): Promise<boolean>;
}
