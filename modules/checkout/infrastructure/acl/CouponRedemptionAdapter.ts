/**
 * CouponRedemptionAdapter
 *
 * ACL adapter implementing checkout's CouponRedemptionPort.
 * Translates coupon's RedeemCouponUseCase into checkout's
 * fire-and-forget redemption vocabulary.
 */

import { CouponRedemptionPort, CouponRedemptionRequest } from '../../application/ports/CouponRedemptionPort';
import type { RedeemCouponUseCase } from '../../../coupon/application/useCases/RedeemCoupon';

export class CouponRedemptionAdapter implements CouponRedemptionPort {
  constructor(private readonly useCase: Pick<RedeemCouponUseCase, 'execute'>) {}

  async redeemCoupon(request: CouponRedemptionRequest): Promise<void> {
    await this.useCase.execute({
      couponCode: request.couponCode,
      orderId: request.orderId,
      customerId: request.customerId,
      discountAmountCents: request.discountAmountCents,
      currencyCode: request.currencyCode,
    });
  }
}
