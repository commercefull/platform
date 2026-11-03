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
import { ChargeDelegatedPaymentUseCase } from './ChargeDelegatedPayment';

import { ProcessPaymentWebhookUseCase } from './ProcessPaymentWebhook';
import { GetPaymentBalanceUseCase } from './GetPaymentBalance';
import { GetPaymentBalancesUseCase } from './GetPaymentBalances';

import { ManagePaymentDisputesUseCase } from './ManagePaymentDisputes';
import { ManagePaymentFeesUseCase } from './ManagePaymentFees';
import { ManagePaymentGatewaysUseCase } from './ManagePaymentGateways';
import { ManagePaymentReportsUseCase } from './ManagePaymentReports';
import { ManagePaymentSettingsUseCase } from './ManagePaymentSettings';

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

const transactions = paymentDataRepository.transactions;
const refunds = paymentDataRepository.refunds;
const gatewayConfig = paymentDataRepository.gatewayConfig;
const settingsRepo = paymentDataRepository.settings;
const webhooks = paymentDataRepository.webhooks;
const storedMethods = paymentDataRepository.storedMethods;
const billingRepo = paymentBillingDataRepository.billing;
const gatewayRepo = paymentDataRepository.gateways;

const processPaymentWebhookUseCase = new ProcessPaymentWebhookUseCase(webhooks);
export const getPaymentBalanceUseCase = new GetPaymentBalanceUseCase(billingRepo);
export const getPaymentBalancesUseCase = new GetPaymentBalancesUseCase(billingRepo);

export const managePaymentDisputesUseCase = new ManagePaymentDisputesUseCase(billingRepo);
export const managePaymentFeesUseCase = new ManagePaymentFeesUseCase(billingRepo);
export const managePaymentGatewaysUseCase = new ManagePaymentGatewaysUseCase(gatewayRepo);
export const managePaymentReportsUseCase = new ManagePaymentReportsUseCase(billingRepo);
export const managePaymentSettingsUseCase = new ManagePaymentSettingsUseCase(settingsRepo);

export const saveStoredPaymentMethodUseCase = new SaveStoredPaymentMethodUseCase(storedMethods);
export const manageFraudRecordsUseCase = new ManageFraudRecordsUseCase(paymentBillingDataRepository.fraud);
export const managePaymentRecordsUseCase = new ManagePaymentRecordsUseCase(transactions, refunds, gatewayConfig, storedMethods);
export const initiatePaymentUseCase = new InitiatePaymentUseCase(transactions, gatewayConfig);
export const getTransactionUseCase = new GetTransactionUseCase(transactions);
export const listTransactionsUseCase = new ListTransactionsUseCase(transactions);
export const processPaymentRefundUseCase = new ProcessPaymentRefundUseCase(transactions, refunds);

// Adapters bridging the repositories to the narrower use-case port interfaces.
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
    const methods = await gatewayConfig.getEnabledPaymentMethods('default');
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
    const txn = await transactions.findTransactionById(id);
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
    // Transaction updates via the domain entity are handled through PaymentTransactionRepo.saveTransaction
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
  transactions,
  gatewayWebhookPort,
  orderStatusSyncAdapter,
  processPaymentWebhookUseCase,
);

// PSP routing — the engine is a process-level singleton so circuit breaker
// state persists across requests.
const failoverRoutingEngine = new FailoverRoutingEngine({
  maxRetriesPerProvider: 2,
  retryBaseDelayMs: 500,
  retryMaxDelayMs: 5000,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 60_000,
  healthCheckIntervalMs: 0,
});

const pspRoutingRepo = new PSPRoutingRepositoryImpl(gatewayRepo);
const routePaymentUseCase = new RoutePaymentUseCase(pspRoutingRepo, failoverRoutingEngine);
export const chargeDelegatedPaymentUseCase = new ChargeDelegatedPaymentUseCase(transactions, routePaymentUseCase, orderStatusSyncAdapter);
