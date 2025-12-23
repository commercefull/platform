/**
 * GetPendingApprovals Use Case
 */

export interface GetPendingApprovalsInput {
  approverId: string;
  companyId?: string;
  requestType?: 'order' | 'quote' | 'purchase_order' | 'credit_request';
  page?: number;
  limit?: number;
}

export interface PendingApprovalItem {
  requestId: string;
  requestType: string;
  referenceId: string;
  requestedById: string;
  requestedByName?: string;
  amount?: number;
  currency?: string;
  currentStep: number;
  totalSteps: number;
  submittedAt: string;
  notes?: string;
}

export interface GetPendingApprovalsOutput {
  approvals: PendingApprovalItem[];
  total: number;
  page: number;
  limit: number;
}

export class GetPendingApprovalsUseCase {
  constructor(private readonly b2bRepository: any) {}

  async execute(input: GetPendingApprovalsInput): Promise<GetPendingApprovalsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 20;

    // Get pending requests where user is an approver for current step
    const pendingRequests = await this.b2bRepository.findPendingApprovalsForUser(input.approverId, {
      companyId: input.companyId,
      requestType: input.requestType,
      page,
      limit,
    });

    const total = await this.b2bRepository.countPendingApprovalsForUser(input.approverId, {
      companyId: input.companyId,
      requestType: input.requestType,
    });

    return {
      approvals: pendingRequests.map((r: any) => ({
        requestId: r.requestId,
        requestType: r.requestType,
        referenceId: r.referenceId,
        requestedById: r.requestedById,
        requestedByName: r.requestedByName,
        amount: r.amount,
        currency: r.currency,
        currentStep: r.currentStep,
        totalSteps: r.totalSteps,
        submittedAt: r.submittedAt.toISOString(),
        notes: r.notes,
      })),
      total,
      page,
      limit,
    };
  }
}
