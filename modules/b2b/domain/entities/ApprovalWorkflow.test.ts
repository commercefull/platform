import { ApprovalWorkflow } from './ApprovalWorkflow';

describe('ApprovalWorkflow Entity', () => {
  describe('create', () => {
    it('should create a workflow with approver steps', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-2024-001',
        requestedBy: 'user-1',
        requestedByEmail: 'buyer@acme.com',
        amount: 5000,
        approvers: [
          { approverId: 'mgr-1', approverEmail: 'mgr@acme.com' },
          { approverId: 'vp-1', approverEmail: 'vp@acme.com' },
        ],
      });
      expect(wf.workflowId).toBeDefined();
      expect(wf.status).toBe('pending');
      expect(wf.steps).toHaveLength(2);
      expect(wf.currentStep).toBe(1);
      expect(wf.amount).toBe(5000);
    });

    it('should set step order correctly', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'quote',
        referenceId: 'q-1',
        referenceNumber: 'QT-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 100,
        approvers: [{ approverId: 'a1', approverEmail: 'a@b.com' }],
      });
      expect(wf.steps[0].order).toBe(1);
      expect(wf.steps[0].status).toBe('pending');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const props = {
        workflowId: 'wf-1',
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order' as const,
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        status: 'approved' as const,
        amount: 1000,
        currency: 'USD',
        steps: [{ stepId: 's1', approverId: 'a1', approverEmail: 'a@b.com', status: 'approved' as const, order: 1 }],
        currentStep: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      const wf = ApprovalWorkflow.reconstitute(props);
      expect(wf.workflowId).toBe('wf-1');
      expect(wf.status).toBe('approved');
      expect(wf.isComplete).toBe(true);
    });
  });

  describe('approve', () => {
    it('should advance to next step on approval', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [
          { approverId: 'a1', approverEmail: 'a1@b.com' },
          { approverId: 'a2', approverEmail: 'a2@b.com' },
        ],
      });
      wf.approve('a1', 'Looks good');
      expect(wf.status).toBe('pending');
      expect(wf.currentStep).toBe(2);
    });

    it('should complete workflow on final approval', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [{ approverId: 'a1', approverEmail: 'a1@b.com' }],
      });
      wf.approve('a1');
      expect(wf.status).toBe('approved');
      expect(wf.isComplete).toBe(true);
      expect(wf.completedAt).toBeDefined();
    });

    it('should not allow non-current approver to approve', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [
          { approverId: 'a1', approverEmail: 'a1@b.com' },
          { approverId: 'a2', approverEmail: 'a2@b.com' },
        ],
      });
      expect(() => wf.approve('a2')).toThrow('is not the current approver');
    });
  });

  describe('reject', () => {
    it('should reject the workflow', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [{ approverId: 'a1', approverEmail: 'a1@b.com' }],
      });
      wf.reject('a1', 'Too expensive');
      expect(wf.status).toBe('rejected');
      expect(wf.isComplete).toBe(true);
    });
  });

  describe('escalate', () => {
    it('should skip current step and advance', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [
          { approverId: 'a1', approverEmail: 'a1@b.com' },
          { approverId: 'a2', approverEmail: 'a2@b.com' },
        ],
      });
      wf.escalate();
      expect(wf.status).toBe('escalated');
      expect(wf.currentStep).toBe(2);
    });

    it('should not escalate when no more steps', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [{ approverId: 'a1', approverEmail: 'a1@b.com' }],
      });
      expect(() => wf.escalate()).toThrow('Cannot escalate: no more steps remaining');
    });
  });

  describe('cancel', () => {
    it('should cancel a pending workflow', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [{ approverId: 'a1', approverEmail: 'a1@b.com' }],
      });
      wf.cancel();
      expect(wf.status).toBe('cancelled');
      expect(wf.isComplete).toBe(true);
    });

    it('should not cancel a completed workflow', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [{ approverId: 'a1', approverEmail: 'a1@b.com' }],
      });
      wf.approve('a1');
      expect(() => wf.cancel()).toThrow('in status: approved');
    });
  });

  describe('currentApprover', () => {
    it('should return the current step approver', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [
          { approverId: 'a1', approverEmail: 'a1@b.com' },
          { approverId: 'a2', approverEmail: 'a2@b.com' },
        ],
      });
      expect(wf.currentApprover?.approverId).toBe('a1');
      wf.approve('a1');
      expect(wf.currentApprover?.approverId).toBe('a2');
    });
  });

  describe('toJSON', () => {
    it('should return all props with steps', () => {
      const wf = ApprovalWorkflow.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        type: 'purchase_order',
        referenceId: 'po-1',
        referenceNumber: 'PO-001',
        requestedBy: 'u-1',
        requestedByEmail: 'a@b.com',
        amount: 1000,
        approvers: [{ approverId: 'a1', approverEmail: 'a1@b.com' }],
      });
      const json = wf.toJSON();
      expect(json.workflowId).toBeDefined();
      expect(Array.isArray(json.steps)).toBe(true);
    });
  });
});
