/**
 * MembershipBenefitsPort
 *
 * ACL port owned by pricing. Provides read-only access to membership
 * discount benefits for price calculation.
 *
 * Only the adapter may import from membership's infrastructure.
 */

export interface MembershipDiscountBenefit {
  id: string;
  name: string;
  discountPercentage: number;
}

/**
 * Pricing context used to scope membership benefits to
 * store/channel/country/currency targets when configured.
 */
export interface MembershipBenefitContext {
  storeId?: string;
  channelId?: string;
  countryCode?: string;
  currencyCode?: string;
  regionCode?: string;
}

export interface MembershipBenefitsPort {
  getDiscountBenefits(customerId: string, context?: MembershipBenefitContext): Promise<MembershipDiscountBenefit[]>;
}
