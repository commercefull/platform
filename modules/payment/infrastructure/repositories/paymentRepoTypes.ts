/**
 * Payment repository param types — shared between paymentRepo and its query helpers.
 */

import type { PaymentGateway, PaymentMethodConfig } from '../../../../libs/db/types';

export type PaymentGatewayCreateParams = Omit<PaymentGateway, 'paymentGatewayId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentGatewayUpdateParams = Partial<PaymentGatewayCreateParams>;

export type PaymentMethodConfigCreateParams = Omit<PaymentMethodConfig, 'paymentMethodConfigId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentMethodConfigUpdateParams = Partial<PaymentMethodConfigCreateParams>;
