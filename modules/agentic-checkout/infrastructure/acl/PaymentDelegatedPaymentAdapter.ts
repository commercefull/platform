/**
 * PaymentDelegatedPaymentAdapter
 *
 * ACL adapter bridging agentic-checkout's DelegatedPaymentPort to the payment
 * module's ChargeDelegatedPayment use case. Translates vocabulary only — the
 * transaction lifecycle stays inside payment.
 */

import { ChargeDelegatedPaymentUseCase, ChargeDelegatedPaymentCommand } from '../../../payment/application/useCases/ChargeDelegatedPayment';
import type { DelegatedPaymentPort, DelegatedChargeRequest, DelegatedChargeResult } from '../../application/ports/DelegatedPaymentPort';

export class PaymentDelegatedPaymentAdapter implements DelegatedPaymentPort {
  constructor(private readonly chargeDelegatedPaymentUseCase: Pick<ChargeDelegatedPaymentUseCase, 'execute'>) {}

  async chargeDelegatedPayment(params: DelegatedChargeRequest): Promise<DelegatedChargeResult> {
    const response = await this.chargeDelegatedPaymentUseCase.execute(
      new ChargeDelegatedPaymentCommand({
        organizationId: params.organizationId,
        orderId: params.orderId,
        transactionId: params.transactionId,
        amountCents: params.amountCents,
        currency: params.currency,
        credential: params.credential,
        customerId: params.customerId,
        customerEmail: params.customerEmail,
      }),
    );
    return {
      externalTransactionId: response.externalTransactionId,
      provider: response.provider,
      status: response.status,
    };
  }
}
