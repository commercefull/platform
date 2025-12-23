/**
 * RejectRequest Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface RejectRequestInput {
  requestId: string;
  rejectedById: string;
  reason: string;
}

export interface RejectRequestOutput {
  requestId: string;
  status: string;
  rejectedAt: string;
  reason: string;
}

export class RejectRequestUseCase {
  constructor(private readonly b2bRepository: any) {}

  async execute(input: RejectRequestInput): Promise<RejectRequestOutput> {
    if (!input.reason) {
      throw new Error('Rejection reason is required');
    }

    const request = await this.b2bRepository.findApprovalRequestById(input.requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${input.requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is not pending. Status: ${request.status}`);
    }

    const now = new Date();

    // Record rejection action
    await this.b2bRepository.createApprovalAction({
      actionId: `act_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
      requestId: input.requestId,
      stepNumber: request.currentStep,
      actionType: 'reject',
      actionById: input.rejectedById,
      comments: input.reason,
      actionAt: now,
    });

    // Update request status
    await this.b2bRepository.updateApprovalRequest(input.requestId, {
      status: 'rejected',
      completedAt: now,
    });

    eventBus.emit('b2b.request_rejected', {
      requestId: input.requestId,
      rejectedById: input.rejectedById,
      reason: input.reason,
      referenceId: request.referenceId,
      requestType: request.requestType,
    });

    return {
      requestId: input.requestId,
      status: 'rejected',
      rejectedAt: now.toISOString(),
      reason: input.reason,
    };
  }
}
