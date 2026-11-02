/**
 * Mock payment processing helpers — legacy shim used by PaymentRepo.
 */

import type { PaymentTransaction, PaymentRefund } from '../../../../libs/db/types';
import type { PaymentTransactionCreateParams, PaymentRefundCreateParams } from './paymentRepoTypes';

interface ProcessingRepo {
  createTransaction(params: PaymentTransactionCreateParams): Promise<PaymentTransaction>;
  createRefund(params: PaymentRefundCreateParams): Promise<PaymentRefund>;
}

export async function processPaymentMock(
  repo: ProcessingRepo,
  paymentData: {
    orderPaymentId: string;
    orderId: string;
    customerId?: string;
    amountCents: number;
    currency: string;
    paymentMethodId?: string;
    paymentGatewayId?: string;
  },
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const transaction = await repo.createTransaction({
      orderPaymentId: paymentData.orderPaymentId,
      orderId: paymentData.orderId,
      type: 'sale',
      amountCents: paymentData.amountCents,
      currencyCode: paymentData.currency,
      status: 'paid',
      customerId: paymentData.customerId || null,
      paymentMethodId: paymentData.paymentMethodId || null,
      paymentGatewayId: paymentData.paymentGatewayId || null,
      gatewayResponse: { mock: true },
      settlementCurrencyCode: null,
      settlementAmountCents: null,
      accountingCurrencyCode: null,
      accountingAmountCents: null,
      fxRate: null,
    });

    return { success: true, transactionId: transaction.paymentTransactionId };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function processRefundMock(
  repo: ProcessingRepo,
  refundData: {
    orderPaymentId: string;
    orderId: string;
    paymentTransactionId: string;
    amountCents: number;
    currency: string;
    reason?: string;
  },
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const refund = await repo.createRefund({
      orderPaymentId: refundData.orderPaymentId,
      orderId: refundData.orderId,
      paymentTransactionId: refundData.paymentTransactionId,
      amountCents: refundData.amountCents,
      currencyCode: refundData.currency,
      reason: refundData.reason || null,
      status: 'completed',
      gatewayResponse: { mock: true },
    });

    return { success: true, refundId: refund.paymentRefundId };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}
