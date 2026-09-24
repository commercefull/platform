import type {
  MembershipPlan,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
} from '../../domain/repositories/MembershipRepository';

export interface MembershipPlansPort {
  findAll(activeOnly?: boolean): Promise<MembershipPlan[]>;
  findById(id: string): Promise<MembershipPlan | null>;
  getStatistics(): Promise<{ total: number; active: number; public: number; byCycle: Record<string, number> }>;
  create(params: CreateMembershipPlanInput): Promise<MembershipPlan>;
  update(id: string, updates: UpdateMembershipPlanInput): Promise<MembershipPlan | null>;
  activate(id: string): Promise<MembershipPlan | null>;
  deactivate(id: string): Promise<MembershipPlan | null>;
  remove(id: string): Promise<boolean>;
}


export class ManageMembershipPlansUseCase {
  constructor(private readonly membershipPlanRepo: MembershipPlansPort) {}

  async findAll(activeOnly?: boolean) {
    return this.membershipPlanRepo.findAll(activeOnly);
  }
  async findById(id: string) {
    return this.membershipPlanRepo.findById(id);
  }
  async getStatistics() {
    return this.membershipPlanRepo.getStatistics();
  }
  async create(params: CreateMembershipPlanInput) {
    return this.membershipPlanRepo.create(params);
  }
  async update(id: string, updates: UpdateMembershipPlanInput) {
    return this.membershipPlanRepo.update(id, updates);
  }
  async activate(id: string) {
    return this.membershipPlanRepo.activate(id);
  }
  async deactivate(id: string) {
    return this.membershipPlanRepo.deactivate(id);
  }
  async remove(id: string) {
    return this.membershipPlanRepo.remove(id);
  }
}

