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
}

