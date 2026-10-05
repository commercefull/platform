/**
 * MembershipBenefitsAdapter
 *
 * ACL adapter implementing pricing's MembershipBenefitsPort.
 * Translates membership's MembershipRepo into pricing's
 * MembershipDiscountBenefit vocabulary.
 *
 * Benefits may carry optional targeting scopes (storeIds, channelIds,
 * countryCodes, currencyCodes) in their value payload; a scoped benefit
 * only applies when the pricing context matches.
 *
 * Only this adapter may import from membership's infrastructure.
 */

import {
  MembershipBenefitContext,
  MembershipBenefitsPort,
  MembershipDiscountBenefit,
} from '../../application/ports/MembershipBenefitsPort';
import type { MembershipRepo } from '../../../membership/infrastructure/repositories/membershipRepo';

function scopeMatches(scope: string[] | undefined, value: string | undefined, normalizeCase = false): boolean {
  if (!scope || scope.length === 0) return true;
  if (!value) return false;
  if (!normalizeCase) return scope.includes(value);
  const upper = value.toUpperCase();
  return scope.some(entry => entry.toUpperCase() === upper);
}

export class MembershipBenefitsAdapter implements MembershipBenefitsPort {
  constructor(private readonly membershipRepo: Pick<MembershipRepo, 'getUserMembershipBenefits'>) {}

  async getDiscountBenefits(customerId: string, context?: MembershipBenefitContext): Promise<MembershipDiscountBenefit[]> {
    const benefits = await this.membershipRepo.getUserMembershipBenefits(customerId);
    return (benefits || [])
      .filter(b => b.benefitType === 'discount' && b.discountPercentage !== undefined)
      .filter(
        b =>
          scopeMatches(b.storeIds, context?.storeId) &&
          scopeMatches(b.channelIds, context?.channelId) &&
          scopeMatches(b.countryCodes, context?.countryCode, true) &&
          scopeMatches(b.currencyCodes, context?.currencyCode, true),
      )
      .map(b => ({
        id: b.id,
        name: b.name,
        discountPercentage: b.discountPercentage || 0,
      }));
  }
}
