/**
 * PaymentPaymentAuthorizationAdapter
 *
 * ACL adapter implementing checkout's PaymentAuthorizationPort.
 * Translates payment's InitiatePayment use case into checkout's
 * PaymentAuthorizationResult vocabulary.
 */

import {
  PaymentAuthorizationPort,
  PaymentAuthorizationRequest,
  PaymentAuthorizationResult,
} from '../../application/ports/PaymentAuthorizationPort';
import { InitiatePaymentUseCase, InitiatePaymentCommand } from '../../../payment/application/useCases/InitiatePayment';

export class PaymentPaymentAuthorizationAdapter implements PaymentAuthorizationPort {
  constructor(private readonly initiatePaymentUseCase: InitiatePaymentUseCase) {}

  async initiatePayment(request: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    try {
      const command = new InitiatePaymentCommand(
        request.orderId,
        request.amountCents,
        request.currency,
        request.paymentMethodId,
        request.customerId,
      );
      const response = await this.initiatePaymentUseCase.execute(command);
      return {
        transactionId: response.transactionId,
        status: 'initiated',
      };
    } catch (err: unknown) {
      const cause = err instanceof Error ? err : new Error(String(err));
      throw Object.assign(new Error((err as Error).message || 'No payment gateway configured'), { cause });
    }
  }
}
