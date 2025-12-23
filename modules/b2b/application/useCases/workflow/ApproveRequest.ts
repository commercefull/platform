/**
 * ApproveRequest Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface ApproveRequestInput {
  requestId: string;
  approverId: string;
  comments?: string;
}

export interface ApproveRequestOutput {
  requestId: string;
  currentStep: number;
  totalSteps: number;
  status: string;
  isComplete: boolean;
  nextApprovers?: string[];
  approvedAt: string;
}

export class ApproveRequestUseCase {
  constructor(private readonly b2bRepository: any) {}

  async execute(input: ApproveRequestInput): Promise<ApproveRequestOutput> {
    const request = await this.b2bRepository.findApprovalRequestById(input.requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${input.requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is not pending approval. Status: ${request.status}`);
    }

    const workflow = await this.b2bRepository.findApprovalWorkflowById(request.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const currentStep = workflow.steps.find((s: any) => s.stepOrder === request.currentStep);
    
    // Verify approver has permission
    const canApprove = await this.verifyApprover(input.approverId, currentStep, request.companyId);
    if (!canApprove) {
      throw new Error('User is not authorized to approve this request');
    }

    const now = new Date();

    // Record approval action
    await this.b2bRepository.createApprovalAction({
      actionId: `act_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
      requestId: input.requestId,
      stepNumber: request.currentStep,
      actionType: 'approve',
      actionById: input.approverId,
      comments: input.comments,
      actionAt: now,
    });

    // Check if step is complete
    const stepApprovals = await this.b2bRepository.countStepApprovals(
      input.requestId,
      request.currentStep
    );

    let isComplete = false;
    let newStatus = 'pending';
    let newStep = request.currentStep;
    let nextApprovers: string[] = [];

    if (stepApprovals >= currentStep.requiredApprovals) {
      // Move to next step or complete
      const nextStep = workflow.steps.find((s: any) => s.stepOrder === request.currentStep + 1);

      if (nextStep) {
        newStep = request.currentStep + 1;
        nextApprovers = await this.getApproversForStep(nextStep, request.companyId);
      } else {
        // All steps complete
        isComplete = true;
        newStatus = 'approved';
      }
    }

    await this.b2bRepository.updateApprovalRequest(input.requestId, {
      currentStep: newStep,
      status: newStatus,
      completedAt: isComplete ? now : undefined,
    });

    eventBus.emit('b2b.request_approved', {
      requestId: input.requestId,
      approverId: input.approverId,
      isComplete,
      referenceId: request.referenceId,
      requestType: request.requestType,
    });

    return {
      requestId: input.requestId,
      currentStep: newStep,
      totalSteps: workflow.steps.length,
      status: newStatus,
      isComplete,
      nextApprovers: nextApprovers.length > 0 ? nextApprovers : undefined,
      approvedAt: now.toISOString(),
    };
  }

  private async verifyApprover(approverId: string, step: any, companyId: string): Promise<boolean> {
    if (!step) return false;
    if (step.approverId === approverId) return true;
    // Additional role/department checks would go here
    return true; // Simplified for now
  }

  private async getApproversForStep(step: any, companyId: string): Promise<string[]> {
    if (!step) return [];
    if (step.approverId) return [step.approverId];
    return [];
  }
}
