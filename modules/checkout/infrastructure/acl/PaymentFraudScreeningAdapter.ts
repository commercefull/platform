/**
 * PaymentFraudScreeningAdapter
 *
 * ACL adapter that bridges checkout's `FraudScreeningPort` to the payment
 * module's `FraudScreeningService`. Translates checkout vocabulary
 * (FraudScreeningRequest/Result) to/from the payment domain's
 * FraudScreeningRequest/Result.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic G.
 */

import { FraudScreeningService } from '../../../payment/application/services/FraudScreeningService';
import type { FraudScreeningPort, FraudScreeningRequest, FraudScreeningResult } from '../../application/ports/FraudScreeningPort';

export class PaymentFraudScreeningAdapter implements FraudScreeningPort {
  constructor(private readonly fraudScreeningService: Pick<FraudScreeningService, 'screen'>) {}

  async screenOrder(request: FraudScreeningRequest): Promise<FraudScreeningResult> {
    const result = await this.fraudScreeningService.screen({
      orderId: request.orderId,
      customerId: request.customerId,
      email: request.customerEmail,
      ipAddress: request.ipAddress,
      billingCountry: request.billingCountry,
      shippingCountry: request.shippingCountry,
      orderAmountCents: request.orderAmountCents,
      currency: request.currency,
      paymentMethod: request.paymentMethodId,
      isFirstOrder: request.isFirstOrder,
      isGuestCheckout: request.isGuestCheckout,
    });

    return {
      decision: result.decision,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      triggeredRules: result.triggeredRules.map(r => ({
        ruleId: r.fraudRuleId,
        name: r.name,
        action: r.action,
      })),
    };
  }
}
