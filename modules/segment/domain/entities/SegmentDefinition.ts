export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'notContains'
  | 'between'
  | 'isNotNull'
  | 'isNull'
  | 'startsWith'
  | 'endsWith';

export type ConditionField =
  | 'lifetimeValue'
  | 'totalOrders'
  | 'averageOrderValue'
  | 'daysSinceLastOrder'
  | 'ordersLast30Days'
  | 'ordersLast90Days'
  | 'ordersLast12Months'
  | 'productViews'
  | 'cartCount'
  | 'abandonedCarts'
  | 'wishlistItemCount'
  | 'reviewCount'
  | 'averageReviewRating'
  | 'visitCount'
  | 'engagementScore'
  | 'churnRisk'
  | 'riskScore'
  | 'rfmSegment'
  | 'tier'
  | 'status'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'firstOrderDate'
  | 'lastOrderDate'
  | 'lastVisitDate'
  | 'preferredCategories'
  | 'preferredProducts'
  | 'preferredPaymentMethods'
  | 'tags'
  | 'customAttributes';

export interface SegmentCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value?: unknown;
  values?: unknown[];
}

export type MatchMode = 'all' | 'any';

export interface SegmentRule {
  conditions: SegmentCondition[];
  matchMode: MatchMode;
}

export interface SegmentDefinitionProps {
  segmentId: string;
  name: string;
  code: string;
  description: string | null;
  conditions: SegmentCondition[];
  matchMode: MatchMode;
  isActive: boolean;
  isSystem: boolean;
  color: string | null;
  icon: string | null;
  memberCount: number;
  lastEvaluatedAt: Date | null;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SegmentDefinition {
  private props: SegmentDefinitionProps;

  private constructor(props: SegmentDefinitionProps) {
    this.props = props;
  }

  static create(params: {
    name: string;
    code: string;
    description?: string;
    conditions: SegmentCondition[];
    matchMode?: MatchMode;
    color?: string;
    icon?: string;
    organizationId?: string;
  }): SegmentDefinition {
    return new SegmentDefinition({
      segmentId: '',
      name: params.name,
      code: params.code,
      description: params.description ?? null,
      conditions: params.conditions,
      matchMode: params.matchMode ?? 'all',
      isActive: true,
      isSystem: false,
      color: params.color ?? null,
      icon: params.icon ?? null,
      memberCount: 0,
      lastEvaluatedAt: null,
      organizationId: params.organizationId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: SegmentDefinitionProps): SegmentDefinition {
    return new SegmentDefinition(props);
  }

  get segmentId(): string { return this.props.segmentId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get description(): string | null { return this.props.description; }
  get conditions(): SegmentCondition[] { return this.props.conditions; }
  get matchMode(): MatchMode { return this.props.matchMode; }
  get isActive(): boolean { return this.props.isActive; }
  get isSystem(): boolean { return this.props.isSystem; }
  get color(): string | null { return this.props.color; }
  get icon(): string | null { return this.props.icon; }
  get memberCount(): number { return this.props.memberCount; }
  get lastEvaluatedAt(): Date | null { return this.props.lastEvaluatedAt; }
  get organizationId(): string | null { return this.props.organizationId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt; }

  update(params: Partial<{
    name: string;
    description: string;
    conditions: SegmentCondition[];
    matchMode: MatchMode;
    color: string;
    icon: string;
    isActive: boolean;
  }>): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.description !== undefined) this.props.description = params.description;
    if (params.conditions !== undefined) this.props.conditions = params.conditions;
    if (params.matchMode !== undefined) this.props.matchMode = params.matchMode;
    if (params.color !== undefined) this.props.color = params.color;
    if (params.icon !== undefined) this.props.icon = params.icon;
    if (params.isActive !== undefined) this.props.isActive = params.isActive;
    this.props.updatedAt = new Date();
  }

  setMemberCount(count: number): void {
    this.props.memberCount = count;
    this.props.lastEvaluatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  activate(): void { this.props.isActive = true; this.props.updatedAt = new Date(); }
  deactivate(): void { this.props.isActive = false; this.props.updatedAt = new Date(); }

  toJSON(): SegmentDefinitionProps {
    return { ...this.props };
  }
}
