/**
 * MembershipBenefitsAdapter
 *
 * ACL adapter implementing pricing's MembershipBenefitsPort.
 * Translates membership's MembershipRepo into pricing's
 * MembershipDiscountBenefit vocabulary.
 *
 * Only this adapter may import from membership's infrastructure.
 */

import { MembershipBenefitsPort, MembershipDiscountBenefit } from '../../application/ports/MembershipBenefitsPort';
import type { MembershipRepo } from '../../../membership/infrastructure/repositories/membershipRepo';

export class MembershipBenefitsAdapter implements MembershipBenefitsPort {
  constructor(private readonly membershipRepo: Pick<MembershipRepo, 'getUserMembershipBenefits'>) {}

  async getDiscountBenefits(customerId: string): Promise<MembershipDiscountBenefit[]> {
    const benefits = await this.membershipRepo.getUserMembershipBenefits(customerId);
    return (benefits || [])
      .filter(b => b.benefitType === 'discount' && b.discountPercentage !== undefined)
      .map(b => ({
        id: b.id,
        name: b.name,
        discountPercentage: b.discountPercentage || 0,
      }));
  }
}
