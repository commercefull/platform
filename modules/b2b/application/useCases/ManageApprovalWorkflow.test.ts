import '../../tests/testUtils';
import { ManageApprovalWorkflowUseCase } from './ManageApprovalWorkflow';
import {
  B2BValidationError, ApprovalWorkflowNotFoundError, UnauthorizedApproverError,
} from '../../domain/errors/B2BErrors';
import type { CompanyRepository, ApprovalWorkflowRepository } from '../../domain/repositories/B2BRepository';
import { createApprovalWorkflow, createCompany, emitMock, lazyMock } from '../../tests/testUtils';

describe('ManageApprovalWorkflowUseCase', () => {
  let workflowRepo: jest.Mocked<ApprovalWorkflowRepository>;
  let companyRepo: jest.Mocked<CompanyRepository>;
  let useCase: ManageApprovalWorkflowUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    workflowRepo = lazyMock<ApprovalWorkflowRepository>();
    companyRepo = lazyMock<CompanyRepository>();
    companyRepo.findById.mockResolvedValue(createCompany());
    useCase = new ManageApprovalWorkflowUseCase(workflowRepo, companyRepo);
  });

  it('should create a workflow and emit approval.requested when approvers exist', async () => {
    const result = await useCase.create({
      companyId: 'co-1', organizationId: 'org-1', type: 'purchase_order',
      referenceId: 'r-1', referenceNumber: 'ORD-1', requestedBy: 'u-1',
      requestedByEmail: 'u@x.test', amount: 500,
      approvers: [{ approverId: 'm-1', approverEmail: 'm@x.test' }],
    });

    expect(workflowRepo.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('approval.requested', expect.objectContaining({ workflowId: result.workflowId }));
  });

  it('should throw B2BValidationError when no approvers are provided', async () => {
    await expect(useCase.create({
      companyId: 'co-1', organizationId: 'org-1', type: 'purchase_order',
      referenceId: 'r-1', referenceNumber: 'ORD-1', requestedBy: 'u-1',
      requestedByEmail: 'u@x.test', amount: 500, approvers: [],
    })).rejects.toThrow(B2BValidationError);
  });

  it('should throw ApprovalWorkflowNotFoundError when the workflow does not exist', async () => {
    workflowRepo.findById.mockResolvedValue(null);

    await expect(useCase.get('missing')).rejects.toThrow(ApprovalWorkflowNotFoundError);
  });

  it('should throw UnauthorizedApproverError when a non-current approver tries to approve', async () => {
    workflowRepo.findById.mockResolvedValue(createApprovalWorkflow());

    await expect(useCase.approve('w-1', 'intruder')).rejects.toThrow(UnauthorizedApproverError);
  });

  it('should approve and emit approval.approved when the current approver acts', async () => {
    workflowRepo.findById.mockResolvedValue(createApprovalWorkflow());

    await useCase.approve('w-1', 'mgr-1');

    expect(emitMock).toHaveBeenCalledWith('approval.approved', expect.objectContaining({ type: 'purchase_order' }));
  });

  it('should reject and emit approval.rejected when the current approver rejects', async () => {
    workflowRepo.findById.mockResolvedValue(createApprovalWorkflow());

    await useCase.reject('w-1', 'mgr-1', 'denied');

    expect(emitMock).toHaveBeenCalledWith('approval.rejected', expect.objectContaining({ comments: 'denied' }));
  });
});
