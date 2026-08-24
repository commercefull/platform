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

export interface MembershipBenefitsPort {
  getDiscountBenefits(customerId: string): Promise<MembershipDiscountBenefit[]>;
}
