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
import { ApplyGatewayWebhookEventUseCase } from './ApplyGatewayWebhookEvent';
import { ManageFraudRecordsUseCase } from './ManageFraudRecords';
import { ManagePaymentRecordsUseCase } from './ManagePaymentRecords';
import { InitiatePaymentUseCase } from './InitiatePayment';
import { GetTransactionUseCase } from './GetTransaction';
import { ListTransactionsUseCase } from './ListTransactions';
import { ProcessPaymentRefundUseCase } from './ProcessRefund';
import { GetPaymentMethodsUseCase } from './GetPaymentMethods';
import { CapturePaymentUseCase } from './CapturePayment';
import { gatewayWebhookPort, orderStatusSyncAdapter } from '../wired';

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
export const manageFraudRecordsUseCase = new ManageFraudRecordsUseCase(paymentBillingDataRepository.fraud);
export const managePaymentRecordsUseCase = new ManagePaymentRecordsUseCase(paymentRepo);
export const initiatePaymentUseCase = new InitiatePaymentUseCase(paymentRepo);
export const getTransactionUseCase = new GetTransactionUseCase(paymentRepo);
export const listTransactionsUseCase = new ListTransactionsUseCase(paymentRepo);
export const processPaymentRefundUseCase = new ProcessPaymentRefundUseCase(paymentRepo);

// Adapters bridging PaymentRepository to the narrower use-case port interfaces.
const paymentMethodsRepoAdapter = {
  findSavedPaymentMethods: async (_customerId: string) => {
    // PaymentRepo does not currently expose saved methods at this level;
    // return empty array until the repository is extended.
    return [] as Array<{
      paymentMethodId: string;
      type: 'card' | 'bank_account' | 'wallet' | 'buy_now_pay_later' | 'crypto';
      provider: string;
      name?: string;
      isDefault: boolean;
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
    }>;
  },
};

const paymentConfigRepoAdapter = {
  findActiveConfigs: async (_params: { storeId?: string; channelId?: string }) => {
    const methods = await paymentRepo.getEnabledPaymentMethods('default');
    return methods.map(m => ({
      paymentMethodConfigId: m.paymentMethodConfigId,
      type: 'card' as const,
      provider: m.paymentMethod,
      displayName: m.displayName,
      isActive: true,
      minAmountCents: undefined,
      maxAmountCents: undefined,
      supportedCurrencies: undefined,
      supportedCountries: undefined,
    }));
  },
};

const captureRepoAdapter = {
  findTransactionById: async (id: string) => {
    const txn = await paymentRepo.findTransactionById(id);
    if (!txn) return null;
    const json = txn.toJSON() as Record<string, unknown>;
    return {
      transactionId: json.transactionId as string,
      orderId: json.orderId as string,
      gatewayTransactionId: (json.externalTransactionId as string) || '',
      amountCents: json.amountCents as number,
      currency: json.currency as string,
      status: json.status as string,
    };
  },
  updateTransaction: async () => {
    // Transaction updates via the domain entity are handled through PaymentRepo.saveTransaction
  },
};

const captureGatewayAdapter = {
  capture: async (_params: { transactionId: string; amountCents: number; currency: string; metadata?: Record<string, unknown> }) => {
    // Gateway capture would be implemented via the actual provider SDK
    return { success: true, response: {} };
  },
};

export const getPaymentMethodsUseCase = new GetPaymentMethodsUseCase(paymentMethodsRepoAdapter, paymentConfigRepoAdapter);
export const capturePaymentUseCase = new CapturePaymentUseCase(captureRepoAdapter, captureGatewayAdapter);
export const applyGatewayWebhookEventUseCase = new ApplyGatewayWebhookEventUseCase(
  paymentRepo,
  gatewayWebhookPort,
  orderStatusSyncAdapter,
  processPaymentWebhookUseCase,
);

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
