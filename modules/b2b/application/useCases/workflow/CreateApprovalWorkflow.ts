/**
 * CreateApprovalWorkflow Use Case
 */

export interface ApprovalCondition {
  field: 'total_amount' | 'item_count' | 'category' | 'product' | 'custom';
  operator: 'gt' | 'lt' | 'eq' | 'contains';
  value: unknown;
}

export interface ApprovalStep {
  stepOrder: number;
  approverType: 'user' | 'role' | 'department' | 'manager';
  approverId?: string;
  approverRole?: string;
  requiredApprovals: number;
  canSkip: boolean;
  skipConditions?: ApprovalCondition[];
}

export interface CreateApprovalWorkflowInput {
  companyId: string;
  name: string;
  description?: string;
  triggerType: 'order' | 'quote' | 'purchase_order' | 'credit_request';
  conditions: ApprovalCondition[];
  steps: ApprovalStep[];
  escalationTimeoutHours?: number;
  escalationAction?: 'notify_manager' | 'auto_approve' | 'auto_reject';
  isActive?: boolean;
}

export interface CreateApprovalWorkflowOutput {
  workflowId: string;
  name: string;
  triggerType: string;
  stepCount: number;
  createdAt: string;
}

export class CreateApprovalWorkflowUseCase {
  constructor(private readonly b2bRepository: any) {}

  async execute(input: CreateApprovalWorkflowInput): Promise<CreateApprovalWorkflowOutput> {
    if (!input.companyId || !input.name || !input.triggerType) {
      throw new Error('Company ID, name, and trigger type are required');
    }

    if (!input.steps || input.steps.length === 0) {
      throw new Error('At least one approval step is required');
    }

    // Validate step order sequence
    const sortedSteps = [...input.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    for (let i = 0; i < sortedSteps.length; i++) {
      if (sortedSteps[i].stepOrder !== i + 1) {
        throw new Error('Approval steps must have sequential order starting from 1');
      }
    }

    const workflowId = `wf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const workflow = await this.b2bRepository.createApprovalWorkflow({
      workflowId,
      companyId: input.companyId,
      name: input.name,
      description: input.description,
      triggerType: input.triggerType,
      conditions: input.conditions,
      steps: sortedSteps,
      escalationTimeoutHours: input.escalationTimeoutHours || 48,
      escalationAction: input.escalationAction || 'notify_manager',
      isActive: input.isActive ?? true,
    });

    return {
      workflowId: workflow.workflowId,
      name: workflow.name,
      triggerType: workflow.triggerType,
      stepCount: workflow.steps.length,
      createdAt: workflow.createdAt.toISOString(),
    };
  }
}
