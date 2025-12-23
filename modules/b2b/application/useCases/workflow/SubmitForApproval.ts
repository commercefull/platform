/**
 * SubmitForApproval Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface SubmitForApprovalInput {
  companyId: string;
  requestType: 'order' | 'quote' | 'purchase_order' | 'credit_request';
  referenceId: string;
  requestedById: string;
  amount?: number;
  currency?: string;
  notes?: string;
}

export interface SubmitForApprovalOutput {
  requestId: string;
  workflowId: string;
  currentStep: number;
  totalSteps: number;
  status: string;
  nextApprovers: string[];
  submittedAt: string;
}

export class SubmitForApprovalUseCase {
  constructor(private readonly b2bRepository: any) {}

  async execute(input: SubmitForApprovalInput): Promise<SubmitForApprovalOutput> {
    // Find applicable workflow
    const workflows = await this.b2bRepository.findApprovalWorkflows({
      companyId: input.companyId,
      triggerType: input.requestType,
      isActive: true,
    });

    if (!workflows || workflows.length === 0) {
      throw new Error(`No active approval workflow found for ${input.requestType}`);
    }

    // Find matching workflow based on conditions
    let matchingWorkflow = null;
    for (const workflow of workflows) {
      if (this.evaluateConditions(workflow.conditions, input)) {
        matchingWorkflow = workflow;
        break;
      }
    }

    if (!matchingWorkflow) {
      // Use first workflow as default if no conditions match
      matchingWorkflow = workflows[0];
    }

    const requestId = `apr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const approvalRequest = await this.b2bRepository.createApprovalRequest({
      requestId,
      workflowId: matchingWorkflow.workflowId,
      companyId: input.companyId,
      requestType: input.requestType,
      referenceId: input.referenceId,
      requestedById: input.requestedById,
      amount: input.amount,
      currency: input.currency || 'USD',
      currentStep: 1,
      status: 'pending',
      notes: input.notes,
      submittedAt: now,
    });

    // Get next approvers for step 1
    const firstStep = matchingWorkflow.steps.find((s: any) => s.stepOrder === 1);
    const nextApprovers = await this.getApproversForStep(firstStep, input.companyId);

    // Notify approvers
    eventBus.emit('b2b.approval_submitted', {
      requestId,
      companyId: input.companyId,
      requestType: input.requestType,
      referenceId: input.referenceId,
      approvers: nextApprovers,
    });

    return {
      requestId: approvalRequest.requestId,
      workflowId: matchingWorkflow.workflowId,
      currentStep: 1,
      totalSteps: matchingWorkflow.steps.length,
      status: 'pending',
      nextApprovers,
      submittedAt: now.toISOString(),
    };
  }

  private evaluateConditions(conditions: any[], input: SubmitForApprovalInput): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      switch (condition.field) {
        case 'total_amount':
          if (!input.amount) return false;
          return this.compareValue(input.amount, condition.operator, condition.value);
        default:
          return true;
      }
    });
  }

  private compareValue(actual: number, operator: string, expected: unknown): boolean {
    const expectedNum = Number(expected);
    switch (operator) {
      case 'gt':
        return actual > expectedNum;
      case 'lt':
        return actual < expectedNum;
      case 'eq':
        return actual === expectedNum;
      default:
        return true;
    }
  }

  private async getApproversForStep(step: any, companyId: string): Promise<string[]> {
    if (!step) return [];

    // In a real implementation, this would look up users by role/department
    if (step.approverId) {
      return [step.approverId];
    }

    return [];
  }
}
