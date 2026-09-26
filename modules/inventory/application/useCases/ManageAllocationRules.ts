/**
 * Manage Allocation Rules Use Case
 *
 * Admin CRUD for inventory allocation rules.
 */

import type {
  InventoryAllocationRule,
  InventoryAllocationRuleProps,
  AllocationRuleScope,
} from '../../domain/entities/InventoryAllocationRule';

export type CreateAllocationRuleInput = Omit<InventoryAllocationRuleProps, 'inventoryAllocationRuleId'>;

export interface AllocationRulePort {
  findActiveRules(): Promise<InventoryAllocationRule[]>;
  findById(id: string): Promise<InventoryAllocationRule | null>;
  findByScope(scope: AllocationRuleScope, activeOnly?: boolean): Promise<InventoryAllocationRule[]>;
  create(input: CreateAllocationRuleInput): Promise<InventoryAllocationRule>;
}

export class ManageAllocationRulesUseCase {
  constructor(private readonly rules: AllocationRulePort) {}

  async findActiveRules() {
    return this.rules.findActiveRules();
  }

  async findById(id: string) {
    return this.rules.findById(id);
  }

  async findByScope(scope: AllocationRuleScope, activeOnly?: boolean) {
    return this.rules.findByScope(scope, activeOnly);
  }

  async create(input: CreateAllocationRuleInput) {
    return this.rules.create(input);
  }
}
