export interface CustomerProfileProps {
  customerProfileId: string;
  customerId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  status: string | null;
  tier: string | null;

  lifetimeValue: number;
  totalSpent: number;
  averageOrderValue: number;
  totalOrders: number;

  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  ordersLast30Days: number;
  ordersLast90Days: number;
  ordersLast12Months: number;

  productViews: number;
  cartCount: number;
  abandonedCarts: number;
  wishlistItemCount: number;
  reviewCount: number;
  averageReviewRating: number | null;
  visitCount: number;
  lastVisitDate: Date | null;

  rfmSegment: string | null;
  engagementScore: number | null;
  churnRisk: number | null;
  riskScore: number | null;

  preferredCategories: string[] | null;
  preferredProducts: string[] | null;
  preferredPaymentMethods: string[] | null;
  preferredShippingMethods: string[] | null;
  deviceUsage: Record<string, unknown> | null;
  tags: string[] | null;
  customAttributes: Record<string, unknown> | null;
  segmentIds: string[] | null;

  organizationId: string | null;
  lastComputedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerProfile {
  private props: CustomerProfileProps;

  private constructor(props: CustomerProfileProps) {
    this.props = props;
  }

  static create(params: { customerId: string; email?: string; firstName?: string; lastName?: string; organizationId?: string }): CustomerProfile {
    return new CustomerProfile({
      customerProfileId: '',
      customerId: params.customerId,
      email: params.email ?? null,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      status: null,
      tier: null,
      lifetimeValue: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      totalOrders: 0,
      firstOrderDate: null,
      lastOrderDate: null,
      daysSinceLastOrder: null,
      ordersLast30Days: 0,
      ordersLast90Days: 0,
      ordersLast12Months: 0,
      productViews: 0,
      cartCount: 0,
      abandonedCarts: 0,
      wishlistItemCount: 0,
      reviewCount: 0,
      averageReviewRating: null,
      visitCount: 0,
      lastVisitDate: null,
      rfmSegment: null,
      engagementScore: null,
      churnRisk: null,
      riskScore: null,
      preferredCategories: null,
      preferredProducts: null,
      preferredPaymentMethods: null,
      preferredShippingMethods: null,
      deviceUsage: null,
      tags: null,
      customAttributes: null,
      segmentIds: null,
      organizationId: params.organizationId ?? null,
      lastComputedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: CustomerProfileProps): CustomerProfile {
    return new CustomerProfile(props);
  }

  get customerId(): string { return this.props.customerId; }
  get email(): string | null { return this.props.email; }
  get firstName(): string | null { return this.props.firstName; }
  get lastName(): string | null { return this.props.lastName; }
  get lifetimeValue(): number { return this.props.lifetimeValue; }
  get totalSpent(): number { return this.props.totalSpent; }
  get averageOrderValue(): number { return this.props.averageOrderValue; }
  get totalOrders(): number { return this.props.totalOrders; }
  get daysSinceLastOrder(): number | null { return this.props.daysSinceLastOrder; }
  get ordersLast30Days(): number { return this.props.ordersLast30Days; }
  get ordersLast90Days(): number { return this.props.ordersLast90Days; }
  get ordersLast12Months(): number { return this.props.ordersLast12Months; }
  get rfmSegment(): string | null { return this.props.rfmSegment; }
  get engagementScore(): number | null { return this.props.engagementScore; }
  get churnRisk(): number | null { return this.props.churnRisk; }
  get tags(): string[] | null { return this.props.tags; }
  get segmentIds(): string[] | null { return this.props.segmentIds; }
  get tier(): string | null { return this.props.tier; }
  get lastComputedAt(): Date | null { return this.props.lastComputedAt; }

  updateAggregates(params: Partial<CustomerProfileProps>): void {
    Object.assign(this.props, params);
    this.props.lastComputedAt = new Date();
    this.props.updatedAt = new Date();
  }

  computeRFM(): void {
    const r = this.props.daysSinceLastOrder ?? 999;
    const f = this.props.totalOrders;
    const m = this.props.lifetimeValue;

    let rScore: number, fScore: number, mScore: number;

    if (r <= 30) rScore = 5;
    else if (r <= 90) rScore = 4;
    else if (r <= 180) rScore = 3;
    else if (r <= 365) rScore = 2;
    else rScore = 1;

    if (f >= 20) fScore = 5;
    else if (f >= 10) fScore = 4;
    else if (f >= 5) fScore = 3;
    else if (f >= 2) fScore = 2;
    else fScore = 1;

    if (m >= 5000) mScore = 5;
    else if (m >= 2000) mScore = 4;
    else if (m >= 500) mScore = 3;
    else if (m >= 100) mScore = 2;
    else mScore = 1;

    const _total = rScore * 100 + fScore * 10 + mScore;
    this.props.rfmSegment = `${rScore}${fScore}${mScore}`;

    if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
      this.props.tier = 'champion';
    } else if (rScore >= 4 && fScore >= 3) {
      this.props.tier = 'loyal';
    } else if (rScore >= 4 && fScore <= 2) {
      this.props.tier = 'new';
    } else if (rScore <= 2 && fScore >= 3) {
      this.props.tier = 'at-risk';
    } else if (rScore <= 2 && fScore <= 2) {
      this.props.tier = 'lost';
    } else {
      this.props.tier = 'regular';
    }

    this.props.engagementScore = Math.round(((rScore + fScore + mScore) / 15) * 100) / 100;
    this.props.churnRisk = rScore <= 2 ? Math.round((1 - this.props.engagementScore) * 100) / 100 : 0;
  }

  toJSON(): CustomerProfileProps {
    return { ...this.props };
  }
}
