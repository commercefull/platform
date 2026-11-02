export interface CustomerProfileProps {
  customerProfileId: string;
  customerId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  status: string | null;
  tier: string | null;

  lifetimeValueCents: number;
  totalSpentCents: number;
  averageOrderValueCents: number;
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

  static create(params: {
    customerId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    organizationId?: string;
  }): CustomerProfile {
    return new CustomerProfile({
      customerProfileId: '',
      customerId: params.customerId,
      email: params.email ?? null,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      status: null,
      tier: null,
      lifetimeValueCents: 0,
      totalSpentCents: 0,
      averageOrderValueCents: 0,
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

  get customerId(): string {
    return this.props.customerId;
  }
  get email(): string | null {
    return this.props.email;
  }
  get firstName(): string | null {
    return this.props.firstName;
  }
  get lastName(): string | null {
    return this.props.lastName;
  }
  get lifetimeValueCents(): number {
    return this.props.lifetimeValueCents;
  }
  get totalSpentCents(): number {
    return this.props.totalSpentCents;
  }
  get averageOrderValueCents(): number {
    return this.props.averageOrderValueCents;
  }
  get totalOrders(): number {
    return this.props.totalOrders;
  }
  get daysSinceLastOrder(): number | null {
    return this.props.daysSinceLastOrder;
  }
  get ordersLast30Days(): number {
    return this.props.ordersLast30Days;
  }
  get ordersLast90Days(): number {
    return this.props.ordersLast90Days;
  }
  get ordersLast12Months(): number {
    return this.props.ordersLast12Months;
  }
  get rfmSegment(): string | null {
    return this.props.rfmSegment;
  }
  get engagementScore(): number | null {
    return this.props.engagementScore;
  }
  get churnRisk(): number | null {
    return this.props.churnRisk;
  }
  get tags(): string[] | null {
    return this.props.tags;
  }
  get segmentIds(): string[] | null {
    return this.props.segmentIds;
  }
  get tier(): string | null {
    return this.props.tier;
  }
  get lastComputedAt(): Date | null {
    return this.props.lastComputedAt;
  }

  updateAggregates(params: Partial<CustomerProfileProps>): void {
    Object.assign(this.props, params);
    this.props.lastComputedAt = new Date();
    this.props.updatedAt = new Date();
  }

  computeRFM(): void {
    const r = this.props.daysSinceLastOrder ?? 999;
    const f = this.props.totalOrders;
    const m = this.props.lifetimeValueCents;

    const rScore = scoreUpTo(r, [30, 90, 180, 365]);
    const fScore = scoreFrom(f, [20, 10, 5, 2]);
    const mScore = scoreFrom(m, [5000, 2000, 500, 100]);

    this.props.rfmSegment = `${rScore}${fScore}${mScore}`;
    this.props.tier = resolveTier(rScore, fScore, mScore);
    this.props.engagementScore = Math.round(((rScore + fScore + mScore) / 15) * 100) / 100;
    this.props.churnRisk = rScore <= 2 ? Math.round((1 - this.props.engagementScore) * 100) / 100 : 0;
  }

  toJSON(): CustomerProfileProps {
    return { ...this.props };
  }
}

// Score from a `value <= bound` ladder — first bound met wins, else 1.
function scoreUpTo(value: number, bounds: number[]): number {
  for (const [i, bound] of bounds.entries()) {
    if (value <= bound) return bounds.length + 1 - i;
  }
  return 1;
}

// Score from a `value >= bound` ladder — first bound met wins, else 1.
function scoreFrom(value: number, bounds: number[]): number {
  for (const [i, bound] of bounds.entries()) {
    if (value >= bound) return bounds.length + 1 - i;
  }
  return 1;
}

function resolveTier(rScore: number, fScore: number, mScore: number): CustomerProfileProps['tier'] {
  if (rScore >= 4 && fScore >= 4 && mScore >= 4) return 'champion';
  if (rScore >= 4 && fScore >= 3) return 'loyal';
  if (rScore >= 4 && fScore <= 2) return 'new';
  if (rScore <= 2 && fScore >= 3) return 'at-risk';
  if (rScore <= 2 && fScore <= 2) return 'lost';
  return 'regular';
}
