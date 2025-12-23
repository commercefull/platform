/**
 * Membership Tier Entity
 */

export interface TierBenefit {
  benefitId: string;
  name: string;
  type: 'discount' | 'free_shipping' | 'early_access' | 'exclusive_products' | 'points_multiplier' | 'other';
  value: number;
  description?: string;
}

export interface MembershipTierProps {
  tierId: string;
  name: string;
  code: string;
  description?: string;
  level: number;
  pointsRequired: number;
  annualFee?: number;
  benefits: TierBenefit[];
  discountPercentage?: number;
  freeShippingThreshold?: number;
  pointsMultiplier: number;
  isActive: boolean;
  color?: string;
  icon?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class MembershipTier {
  private props: MembershipTierProps;

  private constructor(props: MembershipTierProps) {
    this.props = props;
  }

  static create(props: Omit<MembershipTierProps, 'isActive' | 'createdAt' | 'updatedAt'>): MembershipTier {
    const now = new Date();
    return new MembershipTier({
      ...props,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MembershipTierProps): MembershipTier {
    return new MembershipTier(props);
  }

  get tierId(): string {
    return this.props.tierId;
  }
  get name(): string {
    return this.props.name;
  }
  get level(): number {
    return this.props.level;
  }
  get pointsRequired(): number {
    return this.props.pointsRequired;
  }
  get benefits(): TierBenefit[] {
    return this.props.benefits;
  }
  get discountPercentage(): number | undefined {
    return this.props.discountPercentage;
  }
  get pointsMultiplier(): number {
    return this.props.pointsMultiplier;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  addBenefit(benefit: TierBenefit): void {
    this.props.benefits.push(benefit);
    this.touch();
  }

  removeBenefit(benefitId: string): void {
    this.props.benefits = this.props.benefits.filter(b => b.benefitId !== benefitId);
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
