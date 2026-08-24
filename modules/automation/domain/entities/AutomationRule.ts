export type TriggerType =
  | 'event'
  | 'schedule'
  | 'manual'
  | 'segment_membership_added'
  | 'segment_membership_removed';

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
  | 'startsWith'
  | 'endsWith'
  | 'isNotNull'
  | 'isNull'
  | 'regex';

export type ConditionField =
  | 'event.data.*'
  | 'event.type'
  | 'customer.tier'
  | 'customer.lifetimeValue'
  | 'customer.totalOrders'
  | 'customer.daysSinceLastOrder'
  | 'customer.rfmSegment'
  | 'customer.tags'
  | 'order.totalAmount'
  | 'order.itemCount'
  | 'order.status'
  | 'product.price'
  | 'product.categoryId'
  | 'product.status'
  | 'custom';

export interface TriggerConfig {
  eventName?: string;
  cronExpression?: string;
  segmentId?: string;
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  values?: unknown[];
  dataPath?: string;
}

export type ConditionMatchMode = 'all' | 'any';

export type ActionType =
  | 'send_notification'
  | 'send_email'
  | 'add_tag'
  | 'remove_tag'
  | 'add_to_segment'
  | 'remove_from_segment'
  | 'apply_discount'
  | 'create_order'
  | 'update_order_status'
  | 'emit_event'
  | 'webhook'
  | 'custom';

export interface RuleAction {
  type: ActionType;
  config: Record<string, unknown>;
  delayMs?: number;
}

export type ActionExecutionMode = 'sequential' | 'parallel';

export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'partial';

export interface AutomationRuleProps {
  automationRuleId: string;
  name: string;
  description: string | null;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  conditions: RuleCondition[];
  conditionMatchMode: ConditionMatchMode;
  actions: RuleAction[];
  actionExecutionMode: ActionExecutionMode;
  isActive: boolean;
  priority: number;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastTriggeredAt: Date | null;
  lastExecutedAt: Date | null;
  organizationId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class AutomationRule {
  private props: AutomationRuleProps;

  private constructor(props: AutomationRuleProps) {
    this.props = props;
  }

  static create(params: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    triggerConfig: TriggerConfig;
    conditions?: RuleCondition[];
    conditionMatchMode?: ConditionMatchMode;
    actions: RuleAction[];
    actionExecutionMode?: ActionExecutionMode;
    priority?: number;
    organizationId?: string;
    createdBy?: string;
  }): AutomationRule {
    return new AutomationRule({
      automationRuleId: '',
      name: params.name,
      description: params.description ?? null,
      triggerType: params.triggerType,
      triggerConfig: params.triggerConfig,
      conditions: params.conditions ?? [],
      conditionMatchMode: params.conditionMatchMode ?? 'all',
      actions: params.actions,
      actionExecutionMode: params.actionExecutionMode ?? 'sequential',
      isActive: true,
      priority: params.priority ?? 0,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      lastTriggeredAt: null,
      lastExecutedAt: null,
      organizationId: params.organizationId ?? null,
      createdBy: params.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: AutomationRuleProps): AutomationRule {
    return new AutomationRule(props);
  }

  get automationRuleId(): string { return this.props.automationRuleId; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get triggerType(): TriggerType { return this.props.triggerType; }
  get triggerConfig(): TriggerConfig { return this.props.triggerConfig; }
  get conditions(): RuleCondition[] { return this.props.conditions; }
  get conditionMatchMode(): ConditionMatchMode { return this.props.conditionMatchMode; }
  get actions(): RuleAction[] { return this.props.actions; }
  get actionExecutionMode(): ActionExecutionMode { return this.props.actionExecutionMode; }
  get isActive(): boolean { return this.props.isActive; }
  get priority(): number { return this.props.priority; }
  get executionCount(): number { return this.props.executionCount; }
  get successCount(): number { return this.props.successCount; }
  get failureCount(): number { return this.props.failureCount; }
  get lastTriggeredAt(): Date | null { return this.props.lastTriggeredAt; }
  get lastExecutedAt(): Date | null { return this.props.lastExecutedAt; }
  get organizationId(): string | null { return this.props.organizationId; }
  get createdBy(): string | null { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt; }

  update(params: Partial<{
    name: string;
    description: string;
    triggerConfig: TriggerConfig;
    conditions: RuleCondition[];
    conditionMatchMode: ConditionMatchMode;
    actions: RuleAction[];
    actionExecutionMode: ActionExecutionMode;
    isActive: boolean;
    priority: number;
  }>): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.description !== undefined) this.props.description = params.description;
    if (params.triggerConfig !== undefined) this.props.triggerConfig = params.triggerConfig;
    if (params.conditions !== undefined) this.props.conditions = params.conditions;
    if (params.conditionMatchMode !== undefined) this.props.conditionMatchMode = params.conditionMatchMode;
    if (params.actions !== undefined) this.props.actions = params.actions;
    if (params.actionExecutionMode !== undefined) this.props.actionExecutionMode = params.actionExecutionMode;
    if (params.isActive !== undefined) this.props.isActive = params.isActive;
    if (params.priority !== undefined) this.props.priority = params.priority;
    this.props.updatedAt = new Date();
  }

  recordExecution(success: boolean): void {
    this.props.executionCount++;
    if (success) this.props.successCount++;
    else this.props.failureCount++;
    this.props.lastTriggeredAt = new Date();
    this.props.lastExecutedAt = new Date();
    this.props.updatedAt = new Date();
  }

  activate(): void { this.props.isActive = true; this.props.updatedAt = new Date(); }
  deactivate(): void { this.props.isActive = false; this.props.updatedAt = new Date(); }

  matchesTrigger(triggerType: TriggerType, triggerData?: unknown): boolean {
    if (this.props.triggerType !== triggerType) return false;
    if (triggerType === 'event' && this.props.triggerConfig.eventName) {
      const eventData = triggerData as { type?: string } | undefined;
      return eventData?.type === this.props.triggerConfig.eventName;
    }
    return true;
  }

  toJSON(): AutomationRuleProps {
    return { ...this.props };
  }
}
