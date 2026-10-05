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
      new ChargeDelegatedPaymentCommand(
        params.organizationId,
        params.orderId,
        params.transactionId,
        params.amountCents,
        params.currency,
        params.credential,
        params.customerId,
        params.customerEmail,
      ),
    );
    return {
      externalTransactionId: response.externalTransactionId,
      provider: response.provider,
      status: response.status,
    };
  }
}
