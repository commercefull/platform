/**
 * Segment Entity
 * 
 * Represents a customer segment for targeted marketing and pricing.
 */

export type SegmentType = 'static' | 'dynamic' | 'hybrid';
export type EvaluationFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';
export type RuleOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'between';
export type LogicalOperator = 'AND' | 'OR';

export interface SegmentRule {
  field: string;
  operator: RuleOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface SegmentProps {
  segmentId: string;
  name: string;
  description?: string;
  type: SegmentType;
  rules: SegmentRule[];
  staticMemberIds: string[];
  evaluationFrequency: EvaluationFrequency;
  lastEvaluatedAt?: Date;
  memberCount: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Segment {
  private props: SegmentProps;

  private constructor(props: SegmentProps) {
    this.props = props;
  }

  get segmentId(): string { return this.props.segmentId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get type(): SegmentType { return this.props.type; }
  get rules(): SegmentRule[] { return [...this.props.rules]; }
  get staticMemberIds(): string[] { return [...this.props.staticMemberIds]; }
  get evaluationFrequency(): EvaluationFrequency { return this.props.evaluationFrequency; }
  get lastEvaluatedAt(): Date | undefined { return this.props.lastEvaluatedAt; }
  get memberCount(): number { return this.props.memberCount; }
  get isActive(): boolean { return this.props.isActive; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(props: Omit<SegmentProps, 'segmentId' | 'createdAt' | 'updatedAt' | 'memberCount'>): Segment {
    const now = new Date();
    return new Segment({
      ...props,
      segmentId: generateSegmentId(),
      rules: props.rules || [],
      staticMemberIds: props.staticMemberIds || [],
      memberCount: props.staticMemberIds?.length || 0,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: SegmentProps): Segment {
    return new Segment(props);
  }

  update(updates: Partial<Omit<SegmentProps, 'segmentId' | 'createdAt'>>): void {
    Object.assign(this.props, updates, { updatedAt: new Date() });
  }

  addRule(rule: SegmentRule): void {
    this.props.rules.push(rule);
    this.props.updatedAt = new Date();
  }

  removeRule(index: number): void {
    this.props.rules.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  clearRules(): void {
    this.props.rules = [];
    this.props.updatedAt = new Date();
  }

  addStaticMember(customerId: string): void {
    if (!this.props.staticMemberIds.includes(customerId)) {
      this.props.staticMemberIds.push(customerId);
      this.props.memberCount = this.props.staticMemberIds.length;
      this.props.updatedAt = new Date();
    }
  }

  removeStaticMember(customerId: string): void {
    this.props.staticMemberIds = this.props.staticMemberIds.filter(id => id !== customerId);
    this.props.memberCount = this.props.staticMemberIds.length;
    this.props.updatedAt = new Date();
  }

  updateMemberCount(count: number): void {
    this.props.memberCount = count;
    this.props.lastEvaluatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  toPersistence(): SegmentProps {
    return { ...this.props };
  }
}

function generateSegmentId(): string {
  return `seg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
