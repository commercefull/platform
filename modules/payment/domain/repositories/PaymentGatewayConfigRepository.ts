/**
 * Payment Gateway Config Repository Port
 *
 * Read access to enabled payment-method configurations and the
 * organization's default gateway.
 */

export interface EnabledPaymentMethod {
  paymentMethodConfigId: string;
  paymentMethod: string;
  displayName: string;
  description?: string;
  icon?: string;
  processingFeeCents?: number;
}

export interface PaymentGatewayConfigRepository {
  getEnabledPaymentMethods(organizationId: string, currency?: string): Promise<EnabledPaymentMethod[]>;
  getDefaultGateway(organizationId: string): Promise<{
    gatewayId: string;
    provider: string;
    isTestMode: boolean;
  } | null>;
}
