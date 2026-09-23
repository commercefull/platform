import { ApprovalWorkflow, ApprovalType } from '../../domain/entities/ApprovalWorkflow';
import { CompanyRepository, ApprovalWorkflowRepository } from '../../domain/repositories/B2BRepository';
import {
  CompanyNotFoundError, ApprovalWorkflowNotFoundError, UnauthorizedApproverError, B2BValidationError,
} from '../../domain/errors/B2BErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export class ManageApprovalWorkflowUseCase {
  constructor(
    private workflowRepo: ApprovalWorkflowRepository,
    private companyRepo: CompanyRepository,
  ) {}

  async create(input: {
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
  }): Promise<ApprovalWorkflow> {
    if (input.approvers.length === 0) {
      throw new B2BValidationError('At least one approver is required');
    }
    const company = await this.companyRepo.findById(input.companyId);
    if (!company) throw new CompanyNotFoundError(input.companyId);

    const workflow = ApprovalWorkflow.create(input);
    await this.workflowRepo.save(workflow);
    await eventBus.emit('approval.requested', {
      workflowId: workflow.workflowId,
      companyId: workflow.companyId,
      type: workflow.type,
      referenceNumber: workflow.referenceNumber,
      amount: workflow.amount,
    });
    return workflow;
  }

  async get(workflowId: string): Promise<ApprovalWorkflow> {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) throw new ApprovalWorkflowNotFoundError(workflowId);
    return workflow;
  }

  async listByCompany(companyId: string): Promise<ApprovalWorkflow[]> {
    return this.workflowRepo.findByCompanyId(companyId);
  }

  async listPendingByOrganization(organizationId: string): Promise<ApprovalWorkflow[]> {
    return this.workflowRepo.findPendingByOrganizationId(organizationId);
  }

  async listByApprover(approverId: string, organizationId: string): Promise<ApprovalWorkflow[]> {
    return this.workflowRepo.findByApproverId(approverId, organizationId);
  }

  async approve(workflowId: string, approverId: string, comments?: string): Promise<ApprovalWorkflow> {
    const workflow = await this.get(workflowId);
    const currentApprover = workflow.currentApprover;
    if (!currentApprover || currentApprover.approverId !== approverId) {
      throw new UnauthorizedApproverError(workflowId, approverId);
    }
    workflow.approve(approverId, comments);
    await this.workflowRepo.save(workflow);
    if (workflow.isApproved) {
      await eventBus.emit('approval.approved', {
        workflowId: workflow.workflowId,
        referenceId: workflow.referenceId,
        type: workflow.type,
      });
    }
    return workflow;
  }

  async reject(workflowId: string, approverId: string, comments?: string): Promise<ApprovalWorkflow> {
    const workflow = await this.get(workflowId);
    const currentApprover = workflow.currentApprover;
    if (!currentApprover || currentApprover.approverId !== approverId) {
      throw new UnauthorizedApproverError(workflowId, approverId);
    }
    workflow.reject(approverId, comments);
    await this.workflowRepo.save(workflow);
    await eventBus.emit('approval.rejected', {
      workflowId: workflow.workflowId,
      referenceId: workflow.referenceId,
      type: workflow.type,
      comments,
    });
    return workflow;
  }

  async escalate(workflowId: string): Promise<ApprovalWorkflow> {
    const workflow = await this.get(workflowId);
    workflow.escalate();
    await this.workflowRepo.save(workflow);
    await eventBus.emit('b2b.request_escalated', { workflowId: workflow.workflowId });
    return workflow;
  }

  async cancel(workflowId: string): Promise<ApprovalWorkflow> {
    const workflow = await this.get(workflowId);
    workflow.cancel();
    await this.workflowRepo.save(workflow);
    return workflow;
  }
}
