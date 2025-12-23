/**
 * GetMembershipBenefits Use Case
 */

export interface GetMembershipBenefitsInput {
  customerId: string;
}

export interface BenefitItem {
  type: string;
  value: number | string;
  description?: string;
}

export interface GetMembershipBenefitsOutput {
  hasMembership: boolean;
  tierName?: string;
  tierLevel?: number;
  benefits: BenefitItem[];
  expiresAt?: string;
  daysRemaining?: number;
}

export class GetMembershipBenefitsUseCase {
  constructor(private readonly membershipRepository: any) {}

  async execute(input: GetMembershipBenefitsInput): Promise<GetMembershipBenefitsOutput> {
    const membership = await this.membershipRepository.findActiveByCustomerId(input.customerId);

    if (!membership) {
      return {
        hasMembership: false,
        benefits: [],
      };
    }

    const tier = await this.membershipRepository.findTierById(membership.tierId);

    let daysRemaining: number | undefined;
    if (membership.endDate) {
      const now = new Date();
      const endDate = new Date(membership.endDate);
      daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      hasMembership: true,
      tierName: tier?.name,
      tierLevel: tier?.level,
      benefits: tier?.benefits || [],
      expiresAt: membership.endDate?.toISOString(),
      daysRemaining,
    };
  }
}
