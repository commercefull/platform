import type { MembershipBenefit } from '../../../../libs/db/types';
import type { MembershipPlanBenefit } from '../../domain/repositories/MembershipRepository';

export interface MembershipBenefitsPort {
  findAll(activeOnly?: boolean): Promise<MembershipBenefit[]>;
  findByPlanId(planId: string, activeOnly?: boolean): Promise<MembershipBenefit[]>;
  findById(id: string): Promise<MembershipBenefit | null>;
}

export interface MembershipPlanBenefitsPort {
  findByPlanId(planId: string, activeOnly?: boolean): Promise<MembershipPlanBenefit[]>;
}


export class ManageMembershipBenefitsUseCase {
  constructor(
    private readonly benefitRepo: MembershipBenefitsPort,
    private readonly planBenefitRepo: MembershipPlanBenefitsPort,
  ) {}

  async findAll(activeOnly?: boolean) {
    return this.benefitRepo.findAll(activeOnly);
  }
  async findByPlanId(planId: string, activeOnly?: boolean) {
    return this.benefitRepo.findByPlanId(planId, activeOnly);
  }
  async findById(id: string) {
    return this.benefitRepo.findById(id);
  }
  async findPlanBenefits(planId: string, activeOnly?: boolean) {
    return this.planBenefitRepo.findByPlanId(planId, activeOnly);
  }

  /** Plan benefits joined with benefit details and plan-level overrides. */
  async getPlanBenefitsWithDetails(planId: string, activeOnly = true) {
    const planBenefits = await this.planBenefitRepo.findByPlanId(planId, activeOnly);
    const benefits = [];
    for (const planBenefit of planBenefits) {
      const benefit = await this.benefitRepo.findById(planBenefit.benefitId);
      if (benefit) {
        benefits.push({
          ...benefit,
          planBenefitId: planBenefit.membershipPlanBenefitId,
          priority: planBenefit.priority,
          valueOverride: planBenefit.valueOverride,
          rulesOverride: planBenefit.rulesOverride,
          notes: planBenefit.notes,
        });
      }
    }
    return benefits;
  }
}

