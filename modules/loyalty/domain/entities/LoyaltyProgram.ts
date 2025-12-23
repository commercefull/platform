/**
 * Loyalty Program Entity
 */

export type EarnRuleType = 'purchase' | 'review' | 'referral' | 'birthday' | 'signup' | 'social_share';

export interface EarnRule {
  ruleId: string;
  type: EarnRuleType;
  pointsPerUnit: number;
  unit: 'dollar' | 'item' | 'action';
  multiplier?: number;
  maxPoints?: number;
  minPurchase?: number;
  isActive: boolean;
}

export interface RedemptionRule {
  ruleId: string;
  name: string;
  pointsCost: number;
  rewardType: 'discount' | 'free_product' | 'free_shipping' | 'gift_card';
  rewardValue: number;
  minPoints?: number;
  maxRedemptionsPerCustomer?: number;
  isActive: boolean;
}

export interface LoyaltyProgramProps {
  programId: string;
  name: string;
  description?: string;
  currency: string;
  pointsName: string;
  pointsAbbreviation: string;
  earnRules: EarnRule[];
  redemptionRules: RedemptionRule[];
  pointsExpirationDays?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class LoyaltyProgram {
  private props: LoyaltyProgramProps;

  private constructor(props: LoyaltyProgramProps) {
    this.props = props;
  }

  static create(props: Omit<LoyaltyProgramProps, 'isActive' | 'createdAt' | 'updatedAt'>): LoyaltyProgram {
    const now = new Date();
    return new LoyaltyProgram({
      ...props,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: LoyaltyProgramProps): LoyaltyProgram {
    return new LoyaltyProgram(props);
  }

  get programId(): string {
    return this.props.programId;
  }
  get name(): string {
    return this.props.name;
  }
  get pointsName(): string {
    return this.props.pointsName;
  }
  get earnRules(): EarnRule[] {
    return this.props.earnRules;
  }
  get redemptionRules(): RedemptionRule[] {
    return this.props.redemptionRules;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  calculatePointsForPurchase(amount: number): number {
    const rule = this.props.earnRules.find(r => r.type === 'purchase' && r.isActive);
    if (!rule) return 0;
    if (rule.minPurchase && amount < rule.minPurchase) return 0;

    let points = Math.floor(amount / (rule.unit === 'dollar' ? 1 : 100)) * rule.pointsPerUnit;
    if (rule.multiplier) points *= rule.multiplier;
    if (rule.maxPoints) points = Math.min(points, rule.maxPoints);

    return points;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
