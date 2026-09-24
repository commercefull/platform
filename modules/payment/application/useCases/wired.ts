/**
 * Composition root for payment use cases.
 * Instantiates use cases with concrete infrastructure repositories.
 * Application code and tests should inject ports instead.
 */

import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';
import { PSPRoutingRepositoryImpl } from '../../infrastructure/repositories/PSPRoutingRepositoryImpl';
import { FailoverRoutingEngine } from '../../infrastructure/services/FailoverRoutingEngine';
import { RoutePaymentUseCase } from './RoutePayment';
import { GetProviderHealthUseCase } from './GetProviderHealth';
import { ManagePSPRoutesUseCase } from './ManagePSPRoutes';
import { ProcessPaymentWebhookUseCase } from './ProcessPaymentWebhook';
import { GetPaymentBalanceUseCase } from './GetPaymentBalance';
import { GetPaymentBalancesUseCase } from './GetPaymentBalances';
import { GeneratePaymentReportUseCase } from './GeneratePaymentReport';
import { ManagePaymentDisputesUseCase } from './ManagePaymentDisputes';
import { ManagePaymentFeesUseCase } from './ManagePaymentFees';
import { ManagePaymentGatewaysUseCase } from './ManagePaymentGateways';
import { ManagePaymentReportsUseCase } from './ManagePaymentReports';
import { ManagePaymentSettingsUseCase } from './ManagePaymentSettings';
import { RecordPaymentDisputeUseCase } from './RecordPaymentDispute';
import { RecordPaymentFeeUseCase } from './RecordPaymentFee';
import { SaveStoredPaymentMethodUseCase } from './SaveStoredPaymentMethod';

const paymentRepo = paymentDataRepository.payments;
const billingRepo = paymentBillingDataRepository.billing;
const gatewayRepo = paymentDataRepository.gateways;

export const processPaymentWebhookUseCase = new ProcessPaymentWebhookUseCase(paymentRepo);
export const getPaymentBalanceUseCase = new GetPaymentBalanceUseCase(billingRepo);
export const getPaymentBalancesUseCase = new GetPaymentBalancesUseCase(billingRepo);
export const generatePaymentReportUseCase = new GeneratePaymentReportUseCase(billingRepo);
export const managePaymentDisputesUseCase = new ManagePaymentDisputesUseCase(billingRepo);
export const managePaymentFeesUseCase = new ManagePaymentFeesUseCase(billingRepo);
export const managePaymentGatewaysUseCase = new ManagePaymentGatewaysUseCase(gatewayRepo);
export const managePaymentReportsUseCase = new ManagePaymentReportsUseCase(billingRepo);
export const managePaymentSettingsUseCase = new ManagePaymentSettingsUseCase(paymentRepo);
export const recordPaymentDisputeUseCase = new RecordPaymentDisputeUseCase(billingRepo, gatewayRepo);
export const recordPaymentFeeUseCase = new RecordPaymentFeeUseCase(billingRepo);
export const saveStoredPaymentMethodUseCase = new SaveStoredPaymentMethodUseCase(paymentRepo);

// PSP routing — the engine is a process-level singleton so circuit breaker
// state persists across requests.
export const failoverRoutingEngine = new FailoverRoutingEngine({
  maxRetriesPerProvider: 2,
  retryBaseDelayMs: 500,
  retryMaxDelayMs: 5000,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 60_000,
  healthCheckIntervalMs: 0,
});

const pspRoutingRepo = new PSPRoutingRepositoryImpl(gatewayRepo);
export const routePaymentUseCase = new RoutePaymentUseCase(pspRoutingRepo, failoverRoutingEngine);
export const getProviderHealthUseCase = new GetProviderHealthUseCase(pspRoutingRepo);
export const managePSPRoutesUseCase = new ManagePSPRoutesUseCase(pspRoutingRepo);
