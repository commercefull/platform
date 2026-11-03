/**
 * Payment Refund Repository Port
 */

import { PaymentRefund } from '../entities/PaymentRefund';

export interface PaymentRefundRepository {
  findRefundById(refundId: string): Promise<PaymentRefund | null>;
  findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]>;
  saveRefund(refund: PaymentRefund): Promise<PaymentRefund>;
}
