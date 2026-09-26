import type { FraudBlacklist, FraudCheck, FraudRule } from '../../domain/entities/FraudRule';
import type { BlacklistType, CheckStatus, RiskLevel, RuleType } from '../../domain/entities/FraudRule';
import { FraudCheckNotFoundError, FraudRuleNotFoundError, PaymentValidationError } from '../../domain/errors/PaymentErrors';

interface FraudRecordPort {
  getRules(activeOnly?: boolean): Promise<FraudRule[]>;
  getRule(fraudRuleId: string): Promise<FraudRule | null>;
  saveRule(
    rule: Partial<FraudRule> & { name: string; ruleType: RuleType; conditions: Record<string, unknown> },
  ): Promise<FraudRule>;
  deleteRule(fraudRuleId: string): Promise<void>;
  getChecks(
    filters?: { status?: CheckStatus; riskLevel?: RiskLevel; customerId?: string },
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: FraudCheck[]; total: number }>;
  getCheck(fraudCheckId: string): Promise<FraudCheck | null>;
  getPendingReviews(): Promise<FraudCheck[]>;
  reviewCheck(fraudCheckId: string, decision: 'approved' | 'rejected', reviewedBy: string, notes?: string): Promise<void>;
  getBlacklist(
    filters?: { type?: BlacklistType; isActive?: boolean },
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: FraudBlacklist[]; total: number }>;
  addToBlacklist(entry: {
    type: BlacklistType;
    value: string;
    reason?: string;
    source?: string;
    relatedOrderId?: string;
    relatedCustomerId?: string;
    expiresAt?: Date;
    addedBy?: string;
  }): Promise<FraudBlacklist>;
  removeFromBlacklist(fraudBlacklistId: string): Promise<void>;
}

export class ManageFraudRecordsUseCase {
  constructor(private readonly fraudRepo: FraudRecordPort) {}

  async listRules(activeOnly?: boolean) {
    return this.fraudRepo.getRules(activeOnly);
  }

  async getRule(id: string) {
    const rule = await this.fraudRepo.getRule(id);
    if (!rule) {
      throw new FraudRuleNotFoundError();
    }
    return rule;
  }

  async saveRule(rule: Partial<FraudRule> & { name?: string; ruleType?: RuleType; conditions?: Record<string, unknown> }) {
    if (!rule.name?.trim()) {
      throw new PaymentValidationError('name is required');
    }
    if (!rule.ruleType?.trim()) {
      throw new PaymentValidationError('ruleType is required');
    }
    if (!rule.conditions || typeof rule.conditions !== 'object') {
      throw new PaymentValidationError('conditions is required');
    }
    return this.fraudRepo.saveRule(rule as Parameters<FraudRecordPort['saveRule']>[0]);
  }

  async updateRule(id: string, rule: Parameters<FraudRecordPort['saveRule']>[0]) {
    return this.fraudRepo.saveRule({ fraudRuleId: id, ...rule });
  }

  async deleteRule(id: string) {
    await this.fraudRepo.deleteRule(id);
  }

  async listChecks(
    filters?: { status?: CheckStatus; riskLevel?: RiskLevel; customerId?: string },
    pagination?: { limit?: number; offset?: number },
  ) {
    return this.fraudRepo.getChecks(filters, pagination);
  }

  async getCheck(id: string) {
    const check = await this.fraudRepo.getCheck(id);
    if (!check) {
      throw new FraudCheckNotFoundError();
    }
    return check;
  }

  async getPendingReviews() {
    return this.fraudRepo.getPendingReviews();
  }

  async reviewCheck(id: string, decision: string | undefined, reviewedBy: string, notes?: string) {
    await this.getCheck(id);
    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      throw new PaymentValidationError('decision must be "approved" or "rejected"');
    }
    await this.fraudRepo.reviewCheck(id, decision, reviewedBy, notes);
  }

  async listBlacklist(
    filters?: { type?: BlacklistType; isActive?: boolean },
    pagination?: { limit?: number; offset?: number },
  ) {
    return this.fraudRepo.getBlacklist(filters, pagination);
  }

  async addToBlacklist(entry: Parameters<FraudRecordPort['addToBlacklist']>[0]) {
    if (!entry.type?.trim()) {
      throw new PaymentValidationError('type is required');
    }
    if (!entry.value?.trim()) {
      throw new PaymentValidationError('value is required');
    }
    return this.fraudRepo.addToBlacklist(entry);
  }

  async removeFromBlacklist(id: string) {
    await this.fraudRepo.removeFromBlacklist(id);
  }
}
