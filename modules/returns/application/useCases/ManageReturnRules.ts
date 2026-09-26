import type { ReturnRule, ReturnRuleProps, ReturnRuleScope } from '../../domain/entities/ReturnRule';

export type CreateReturnRuleParams = Omit<ReturnRuleProps, 'returnRuleId'>;

export interface ReturnRulePort {
  findActiveRules(): Promise<ReturnRule[]>;
  findByScope(scope: ReturnRuleScope, activeOnly?: boolean): Promise<ReturnRule[]>;
  findByCategory(categoryId: string, activeOnly?: boolean): Promise<ReturnRule[]>;
  findByProduct(productId: string, activeOnly?: boolean): Promise<ReturnRule[]>;
  findById(returnRuleId: string): Promise<ReturnRule | null>;
  create(input: CreateReturnRuleParams): Promise<ReturnRule>;
}

export class ManageReturnRulesUseCase {
  constructor(private readonly returnRuleRepo: ReturnRulePort) {}

  async findActiveRules() {
    return this.returnRuleRepo.findActiveRules();
  }
  async findByScope(scope: ReturnRuleScope, activeOnly?: boolean) {
    return this.returnRuleRepo.findByScope(scope, activeOnly);
  }
  async findByCategory(categoryId: string, activeOnly?: boolean) {
    return this.returnRuleRepo.findByCategory(categoryId, activeOnly);
  }
  async findByProduct(productId: string, activeOnly?: boolean) {
    return this.returnRuleRepo.findByProduct(productId, activeOnly);
  }
  async findById(returnRuleId: string) {
    return this.returnRuleRepo.findById(returnRuleId);
  }
  async create(input: CreateReturnRuleParams) {
    return this.returnRuleRepo.create(input);
  }
}
