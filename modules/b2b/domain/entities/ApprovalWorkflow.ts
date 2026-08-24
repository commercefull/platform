export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
export type ApprovalType = 'purchase_order' | 'quote' | 'credit_request' | 'spending_limit_override';

import { ApprovalStatusError, UnauthorizedApproverError, B2BValidationError } from '../errors/B2BErrors';

export interface ApprovalStep {
  stepId: string;
  approverId: string;
  approverEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  actedAt?: Date;
  comments?: string;
  order: number;
}

export interface ApprovalWorkflowProps {
  workflowId: string;
  companyId: string;
  organizationId: string;
  type: ApprovalType;
  referenceId: string;
  referenceNumber: string;
  requestedBy: string;
  requestedByEmail: string;
  status: ApprovalStatus;
  amount: number;
  currency: string;
  steps: ApprovalStep[];
  currentStep: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class ApprovalWorkflow {
  private props: ApprovalWorkflowProps;

  private constructor(props: ApprovalWorkflowProps) {
    this.props = { ...props, steps: props.steps.map(s => ({ ...s })) };
  }

  static create(input: {
    companyId: string;
    organizationId: string;
    type: ApprovalType;
    referenceId: string;
    referenceNumber: string;
    requestedBy: string;
    requestedByEmail: string;
    amount: number;
    currency?: string;
    description?: string;
    approvers: Array<{ approverId: string; approverEmail: string }>;
  }): ApprovalWorkflow {
    const now = new Date();
    const steps: ApprovalStep[] = input.approvers.map((a, idx) => ({
      stepId: crypto.randomUUID(),
      approverId: a.approverId,
      approverEmail: a.approverEmail,
      status: 'pending',
      order: idx + 1,
    }));
    return new ApprovalWorkflow({
      workflowId: crypto.randomUUID(),
      companyId: input.companyId,
      organizationId: input.organizationId,
      type: input.type,
      referenceId: input.referenceId,
      referenceNumber: input.referenceNumber,
      requestedBy: input.requestedBy,
      requestedByEmail: input.requestedByEmail,
      status: 'pending',
      amount: input.amount,
      currency: input.currency ?? 'USD',
      steps,
      currentStep: 1,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ApprovalWorkflowProps): ApprovalWorkflow {
    return new ApprovalWorkflow(props);
  }

  get workflowId(): string { return this.props.workflowId; }
  get companyId(): string { return this.props.companyId; }
  get organizationId(): string { return this.props.organizationId; }
  get type(): ApprovalType { return this.props.type; }
  get referenceId(): string { return this.props.referenceId; }
  get referenceNumber(): string { return this.props.referenceNumber; }
  get requestedBy(): string { return this.props.requestedBy; }
  get requestedByEmail(): string { return this.props.requestedByEmail; }
  get status(): ApprovalStatus { return this.props.status; }
  get amount(): number { return this.props.amount; }
  get currency(): string { return this.props.currency; }
  get steps(): ApprovalStep[] { return this.props.steps.map(s => ({ ...s })); }
  get currentStep(): number { return this.props.currentStep; }
  get description(): string | undefined { return this.props.description; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get completedAt(): Date | undefined { return this.props.completedAt; }

  approve(approverId: string, comments?: string): void {
    if (this.props.status !== 'pending') {
      throw new ApprovalStatusError(this.props.workflowId, 'approve', this.props.status);
    }
    const step = this.props.steps.find(s => s.order === this.props.currentStep);
    if (!step) throw new B2BValidationError(`No step at position: ${this.props.currentStep}`);
    if (step.approverId !== approverId) {
      throw new UnauthorizedApproverError(this.props.workflowId, approverId);
    }
    step.status = 'approved';
    step.actedAt = new Date();
    step.comments = comments;
    this.props.updatedAt = new Date();

    if (this.props.currentStep < this.props.steps.length) {
      this.props.currentStep++;
    } else {
      this.props.status = 'approved';
      this.props.completedAt = new Date();
    }
  }

  reject(approverId: string, comments?: string): void {
    if (this.props.status !== 'pending') {
      throw new ApprovalStatusError(this.props.workflowId, 'reject', this.props.status);
    }
    const step = this.props.steps.find(s => s.order === this.props.currentStep);
    if (!step) throw new B2BValidationError(`No step at position: ${this.props.currentStep}`);
    if (step.approverId !== approverId) {
      throw new UnauthorizedApproverError(this.props.workflowId, approverId);
    }
    step.status = 'rejected';
    step.actedAt = new Date();
    step.comments = comments;
    this.props.status = 'rejected';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  escalate(): void {
    if (this.props.status !== 'pending') {
      throw new ApprovalStatusError(this.props.workflowId, 'escalate', this.props.status);
    }
    if (this.props.currentStep < this.props.steps.length) {
      const currentStep = this.props.steps.find(s => s.order === this.props.currentStep);
      if (currentStep) currentStep.status = 'skipped';
      this.props.currentStep++;
      this.props.status = 'escalated';
      this.props.updatedAt = new Date();
    } else {
      throw new B2BValidationError('Cannot escalate: no more steps remaining');
    }
  }

  cancel(): void {
    if (this.props.status !== 'pending') {
      throw new ApprovalStatusError(this.props.workflowId, 'cancel', this.props.status);
    }
    this.props.status = 'cancelled';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get isComplete(): boolean {
    return this.props.status === 'approved' || this.props.status === 'rejected' || this.props.status === 'cancelled';
  }

  get isApproved(): boolean {
    return this.props.status === 'approved';
  }

  get currentApprover(): ApprovalStep | undefined {
    return this.props.steps.find(s => s.order === this.props.currentStep);
  }

  get pendingSteps(): ApprovalStep[] {
    return this.props.steps.filter(s => s.status === 'pending');
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.props,
      steps: this.props.steps.map(s => ({ ...s })),
    };
  }
}
