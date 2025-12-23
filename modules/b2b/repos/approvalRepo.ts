/**
 * Approval Workflow Repository
 * Handles CRUD operations for B2B approval workflows
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type WorkflowType = 'order' | 'quote' | 'user' | 'credit' | 'return' | 'custom';
export type ApproverType = 'user' | 'role' | 'manager' | 'department_head' | 'custom';
export type RequestStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'expired';
export type ActionType = 'approve' | 'reject' | 'delegate' | 'request_info' | 'comment';

export interface B2bApprovalWorkflow {
  b2bApprovalWorkflowId: string;
  b2bCompanyId?: string;
  name: string;
  description?: string;
  workflowType: WorkflowType;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  conditions: Record<string, any>;
  rules: any[];
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  requiresAllApprovers: boolean;
  autoApproveAfterHours?: number;
  autoRejectAfterExpiry: boolean;
  expiryHours: number;
  notifyOnSubmit: boolean;
  notifyOnApprove: boolean;
  notifyOnReject: boolean;
  notifyRequester: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface B2bApprovalWorkflowStep {
  b2bApprovalWorkflowStepId: string;
  b2bApprovalWorkflowId: string;
  stepNumber: number;
  name: string;
  description?: string;
  approverType: ApproverType;
  approverId?: string;
  approverRole?: string;
  approverIds: string[];
  requiresAll: boolean;
  minApprovers: number;
  timeoutHours?: number;
  escalateTo?: string;
  escalateToUserId?: string;
  canDelegate: boolean;
  canSkip: boolean;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface B2bApprovalRequest {
  b2bApprovalRequestId: string;
  b2bApprovalWorkflowId: string;
  b2bCompanyId?: string;
  requestType: WorkflowType;
  entityId: string;
  entityType: string;
  requesterId: string;
  requesterType: 'customer' | 'companyUser' | 'merchant';
  status: RequestStatus;
  currentStep: number;
  totalSteps: number;
  amount?: number;
  currency: string;
  requestNotes?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  approvalHistory: any[];
  finalApproverId?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface B2bApprovalAction {
  b2bApprovalActionId: string;
  b2bApprovalRequestId: string;
  b2bApprovalWorkflowStepId?: string;
  stepNumber: number;
  approverId: string;
  approverType: 'customer' | 'companyUser' | 'merchant';
  action: ActionType;
  comment?: string;
  delegatedTo?: string;
  requestedInfo?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  actionAt: Date;
  createdAt: Date;
}

// ============================================================================
// Approval Workflows
// ============================================================================

export async function getWorkflow(approvalWorkflowId: string): Promise<B2bApprovalWorkflow | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "b2bApprovalWorkflow" WHERE "b2bApprovalWorkflowId" = $1 AND "deletedAt" IS NULL',
    [approvalWorkflowId],
  );
  return row ? mapToWorkflow(row) : null;
}

export async function getWorkflows(companyId?: string, workflowType?: WorkflowType): Promise<B2bApprovalWorkflow[]> {
  let whereClause = '"deletedAt" IS NULL';
  const params: any[] = [];
  let paramIndex = 1;

  if (companyId) {
    whereClause += ` AND ("b2bCompanyId" = $${paramIndex++} OR "b2bCompanyId" IS NULL)`;
    params.push(companyId);
  }
  if (workflowType) {
    whereClause += ` AND "workflowType" = $${paramIndex++}`;
    params.push(workflowType);
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "b2bApprovalWorkflow" WHERE ${whereClause} ORDER BY "priority" DESC, "name" ASC`,
    params,
  );
  return (rows || []).map(mapToWorkflow);
}

export async function getDefaultWorkflow(companyId: string, workflowType: WorkflowType): Promise<B2bApprovalWorkflow | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "b2bApprovalWorkflow" 
     WHERE ("b2bCompanyId" = $1 OR "b2bCompanyId" IS NULL) 
     AND "workflowType" = $2 
     AND "isActive" = true 
     AND "isDefault" = true 
     AND "deletedAt" IS NULL
     ORDER BY "b2bCompanyId" NULLS LAST
     LIMIT 1`,
    [companyId, workflowType],
  );
  return row ? mapToWorkflow(row) : null;
}

export async function findMatchingWorkflow(
  companyId: string,
  workflowType: WorkflowType,
  amount?: number,
): Promise<B2bApprovalWorkflow | null> {
  let whereClause = `("b2bCompanyId" = $1 OR "b2bCompanyId" IS NULL) 
    AND "workflowType" = $2 
    AND "isActive" = true 
    AND "deletedAt" IS NULL`;
  const params: any[] = [companyId, workflowType];
  let paramIndex = 3;

  if (amount !== undefined) {
    whereClause += ` AND ("minAmount" IS NULL OR "minAmount" <= $${paramIndex})`;
    whereClause += ` AND ("maxAmount" IS NULL OR "maxAmount" >= $${paramIndex})`;
    params.push(amount);
    paramIndex++;
  }

  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "b2bApprovalWorkflow" 
     WHERE ${whereClause}
     ORDER BY "b2bCompanyId" NULLS LAST, "priority" DESC
     LIMIT 1`,
    params,
  );
  return row ? mapToWorkflow(row) : null;
}

export async function saveWorkflow(
  workflow: Partial<B2bApprovalWorkflow> & { name: string; workflowType: WorkflowType },
): Promise<B2bApprovalWorkflow> {
  const now = new Date().toISOString();

  if (workflow.b2bApprovalWorkflowId) {
    await query(
      `UPDATE "b2bApprovalWorkflow" SET
        "name" = $1, "description" = $2, "workflowType" = $3, "isActive" = $4,
        "isDefault" = $5, "priority" = $6, "conditions" = $7, "rules" = $8,
        "minAmount" = $9, "maxAmount" = $10, "currency" = $11,
        "requiresAllApprovers" = $12, "autoApproveAfterHours" = $13,
        "autoRejectAfterExpiry" = $14, "expiryHours" = $15, "notifyOnSubmit" = $16,
        "notifyOnApprove" = $17, "notifyOnReject" = $18, "notifyRequester" = $19,
        "metadata" = $20, "updatedAt" = $21
      WHERE "b2bApprovalWorkflowId" = $22`,
      [
        workflow.name,
        workflow.description,
        workflow.workflowType,
        workflow.isActive !== false,
        workflow.isDefault || false,
        workflow.priority || 0,
        JSON.stringify(workflow.conditions || {}),
        JSON.stringify(workflow.rules || []),
        workflow.minAmount,
        workflow.maxAmount,
        workflow.currency || 'USD',
        workflow.requiresAllApprovers || false,
        workflow.autoApproveAfterHours,
        workflow.autoRejectAfterExpiry || false,
        workflow.expiryHours || 72,
        workflow.notifyOnSubmit !== false,
        workflow.notifyOnApprove !== false,
        workflow.notifyOnReject !== false,
        workflow.notifyRequester !== false,
        workflow.metadata ? JSON.stringify(workflow.metadata) : null,
        now,
        workflow.b2bApprovalWorkflowId,
      ],
    );
    return (await getWorkflow(workflow.b2bApprovalWorkflowId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "b2bApprovalWorkflow" (
        "b2bCompanyId", "name", "description", "workflowType", "isActive", "isDefault",
        "priority", "conditions", "rules", "minAmount", "maxAmount", "currency",
        "requiresAllApprovers", "autoApproveAfterHours", "autoRejectAfterExpiry",
        "expiryHours", "notifyOnSubmit", "notifyOnApprove", "notifyOnReject",
        "notifyRequester", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        workflow.b2bCompanyId,
        workflow.name,
        workflow.description,
        workflow.workflowType,
        true,
        workflow.isDefault || false,
        workflow.priority || 0,
        JSON.stringify(workflow.conditions || {}),
        JSON.stringify(workflow.rules || []),
        workflow.minAmount,
        workflow.maxAmount,
        workflow.currency || 'USD',
        workflow.requiresAllApprovers || false,
        workflow.autoApproveAfterHours,
        workflow.autoRejectAfterExpiry || false,
        workflow.expiryHours || 72,
        true,
        true,
        true,
        true,
        workflow.metadata ? JSON.stringify(workflow.metadata) : null,
        now,
        now,
      ],
    );
    return mapToWorkflow(result!);
  }
}

export async function deleteWorkflow(approvalWorkflowId: string): Promise<void> {
  await query('UPDATE "b2bApprovalWorkflow" SET "deletedAt" = $1 WHERE "b2bApprovalWorkflowId" = $2', [
    new Date().toISOString(),
    approvalWorkflowId,
  ]);
}

// ============================================================================
// Workflow Steps
// ============================================================================

export async function getWorkflowSteps(approvalWorkflowId: string): Promise<B2bApprovalWorkflowStep[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "b2bApprovalWorkflowStep" WHERE "b2bApprovalWorkflowId" = $1 ORDER BY "stepNumber" ASC',
    [approvalWorkflowId],
  );
  return (rows || []).map(mapToWorkflowStep);
}

export async function saveWorkflowStep(
  step: Partial<B2bApprovalWorkflowStep> & {
    approvalWorkflowId: string;
    stepNumber: number;
    name: string;
    approverType: ApproverType;
  },
): Promise<B2bApprovalWorkflowStep> {
  const now = new Date().toISOString();

  if (step.b2bApprovalWorkflowStepId) {
    await query(
      `UPDATE "b2bApprovalWorkflowStep" SET
        "stepNumber" = $1, "name" = $2, "description" = $3, "approverType" = $4,
        "approverId" = $5, "approverRole" = $6, "approverIds" = $7,
        "requiresAll" = $8, "minApprovers" = $9, "timeoutHours" = $10,
        "escalateTo" = $11, "escalateToUserId" = $12, "canDelegate" = $13,
        "canSkip" = $14, "conditions" = $15, "metadata" = $16, "updatedAt" = $17
      WHERE "approvalWorkflowStepId" = $18`,
      [
        step.stepNumber,
        step.name,
        step.description,
        step.approverType,
        step.approverId,
        step.approverRole,
        JSON.stringify(step.approverIds || []),
        step.requiresAll || false,
        step.minApprovers || 1,
        step.timeoutHours,
        step.escalateTo,
        step.escalateToUserId,
        step.canDelegate || false,
        step.canSkip || false,
        step.conditions ? JSON.stringify(step.conditions) : null,
        step.metadata ? JSON.stringify(step.metadata) : null,
        now,
        step.b2bApprovalWorkflowStepId,
      ],
    );
    const result = await queryOne<Record<string, any>>('SELECT * FROM "b2bApprovalWorkflowStep" WHERE "b2bApprovalWorkflowStepId" = $1', [
      step.b2bApprovalWorkflowStepId,
    ]);
    return mapToWorkflowStep(result!);
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "b2bApprovalWorkflowStep" (
        "b2bApprovalWorkflowId", "stepNumber", "name", "description", "approverType",
        "approverId", "approverRole", "approverIds", "requiresAll", "minApprovers",
        "timeoutHours", "escalateTo", "escalateToUserId", "canDelegate", "canSkip",
        "conditions", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        step.b2bApprovalWorkflowId,
        step.stepNumber,
        step.name,
        step.description,
        step.approverType,
        step.approverId,
        step.approverRole,
        JSON.stringify(step.approverIds || []),
        step.requiresAll || false,
        step.minApprovers || 1,
        step.timeoutHours,
        step.escalateTo,
        step.escalateToUserId,
        step.canDelegate || false,
        step.canSkip || false,
        step.conditions ? JSON.stringify(step.conditions) : null,
        step.metadata ? JSON.stringify(step.metadata) : null,
        now,
        now,
      ],
    );
    return mapToWorkflowStep(result!);
  }
}

export async function deleteWorkflowStep(approvalWorkflowStepId: string): Promise<void> {
  await query('DELETE FROM "b2bApprovalWorkflowStep" WHERE "approvalWorkflowStepId" = $1', [approvalWorkflowStepId]);
}

// ============================================================================
// Approval Requests
// ============================================================================

export async function getApprovalRequest(approvalRequestId: string): Promise<B2bApprovalRequest | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "b2bApprovalRequest" WHERE "b2bApprovalRequestId" = $1', [
    approvalRequestId,
  ]);
  return row ? mapToApprovalRequest(row) : null;
}

export async function getApprovalRequestByEntity(entityId: string, entityType: string): Promise<B2bApprovalRequest | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "b2bApprovalRequest" 
     WHERE "entityId" = $1 AND "entityType" = $2 AND "status" IN ('pending', 'in_progress')
     ORDER BY "createdAt" DESC LIMIT 1`,
    [entityId, entityType],
  );
  return row ? mapToApprovalRequest(row) : null;
}

export async function getApprovalRequests(
  filters?: {
    companyId?: string;
    requesterId?: string;
    approverId?: string;
    status?: RequestStatus;
    requestType?: WorkflowType;
  },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: B2bApprovalRequest[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.companyId) {
    whereClause += ` AND "b2bCompanyId" = $${paramIndex++}`;
    params.push(filters.companyId);
  }
  if (filters?.requesterId) {
    whereClause += ` AND "requesterId" = $${paramIndex++}`;
    params.push(filters.requesterId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.requestType) {
    whereClause += ` AND "requestType" = $${paramIndex++}`;
    params.push(filters.requestType);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "b2bApprovalRequest" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "b2bApprovalRequest" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToApprovalRequest),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function createApprovalRequest(request: {
  approvalWorkflowId: string;
  companyId?: string;
  requestType: WorkflowType;
  entityId: string;
  entityType: string;
  requesterId: string;
  requesterType: 'customer' | 'companyUser' | 'merchant';
  amount?: number;
  currency?: string;
  requestNotes?: string;
}): Promise<B2bApprovalRequest> {
  const now = new Date().toISOString();

  // Get workflow steps count
  const steps = await getWorkflowSteps(request.approvalWorkflowId);
  const workflow = await getWorkflow(request.approvalWorkflowId);

  const expiresAt = workflow?.expiryHours ? new Date(Date.now() + workflow.expiryHours * 60 * 60 * 1000) : null;

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "b2bApprovalRequest" (
      "b2bApprovalWorkflowId", "b2bCompanyId", "requestType", "entityId", "entityType",
      "requesterId", "requesterType", "status", "currentStep", "totalSteps",
      "amount", "currency", "requestNotes", "approvalHistory", "submittedAt",
      "expiresAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 1, $8, $9, $10, $11, '[]', $12, $13, $14, $15)
    RETURNING *`,
    [
      request.approvalWorkflowId,
      request.companyId,
      request.requestType,
      request.entityId,
      request.entityType,
      request.requesterId,
      request.requesterType,
      steps.length,
      request.amount,
      request.currency || 'USD',
      request.requestNotes,
      now,
      expiresAt?.toISOString(),
      now,
      now,
    ],
  );

  return mapToApprovalRequest(result!);
}

export async function processApprovalAction(
  approvalRequestId: string,
  action: {
    approverId: string;
    approverType: 'customer' | 'companyUser' | 'merchant';
    action: ActionType;
    comment?: string;
    delegatedTo?: string;
  },
): Promise<B2bApprovalRequest> {
  const now = new Date().toISOString();
  const request = await getApprovalRequest(approvalRequestId);

  if (!request) throw new Error('Approval request not found');
  if (request.status !== 'pending' && request.status !== 'in_progress') {
    throw new Error('Request is not pending approval');
  }

  // Record the action
  await query(
    `INSERT INTO "b2bApprovalAction" (
      "b2bApprovalRequestId", "stepNumber", "approverId", "approverType",
      "action", "comment", "delegatedTo", "actionAt", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      approvalRequestId,
      request.currentStep,
      action.approverId,
      action.approverType,
      action.action,
      action.comment,
      action.delegatedTo,
      now,
      now,
    ],
  );

  // Update approval history
  const historyEntry = {
    step: request.currentStep,
    approverId: action.approverId,
    action: action.action,
    comment: action.comment,
    timestamp: now,
  };
  const newHistory = [...request.approvalHistory, historyEntry];

  if (action.action === 'approve') {
    if (request.currentStep >= request.totalSteps) {
      // Final approval
      await query(
        `UPDATE "b2bApprovalRequest" SET 
          "status" = 'approved', "approvalHistory" = $1, "finalApproverId" = $2,
          "approvedAt" = $3, "approvalNotes" = $4, "updatedAt" = $3
         WHERE "b2bApprovalRequestId" = $5`,
        [JSON.stringify(newHistory), action.approverId, now, action.comment, approvalRequestId],
      );
    } else {
      // Move to next step
      await query(
        `UPDATE "b2bApprovalRequest" SET 
          "status" = 'in_progress', "currentStep" = $1, "approvalHistory" = $2, "updatedAt" = $3
         WHERE "b2bApprovalRequestId" = $4`,
        [request.currentStep + 1, JSON.stringify(newHistory), now, approvalRequestId],
      );
    }
  } else if (action.action === 'reject') {
    await query(
      `UPDATE "b2bApprovalRequest" SET 
        "status" = 'rejected', "approvalHistory" = $1, "rejectionReason" = $2,
        "rejectedAt" = $3, "updatedAt" = $3
       WHERE "b2bApprovalRequestId" = $4`,
      [JSON.stringify(newHistory), action.comment, now, approvalRequestId],
    );
  } else {
    // Comment or request info - just update history
    await query(
      `UPDATE "b2bApprovalRequest" SET "approvalHistory" = $1, "updatedAt" = $2
       WHERE "b2bApprovalRequestId" = $3`,
      [JSON.stringify(newHistory), now, approvalRequestId],
    );
  }

  return (await getApprovalRequest(approvalRequestId))!;
}

export async function cancelApprovalRequest(approvalRequestId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "b2bApprovalRequest" SET "status" = 'cancelled', "cancelledAt" = $1, "updatedAt" = $1
     WHERE "b2bApprovalRequestId" = $2`,
    [now, approvalRequestId],
  );
}

// ============================================================================
// Approval Actions
// ============================================================================

export async function getApprovalActions(approvalRequestId: string): Promise<B2bApprovalAction[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "b2bApprovalAction" WHERE "b2bApprovalRequestId" = $1 ORDER BY "actionAt" ASC',
    [approvalRequestId],
  );
  return (rows || []).map(mapToApprovalAction);
}

// ============================================================================
// Helpers
// ============================================================================

function mapToWorkflow(row: Record<string, any>): B2bApprovalWorkflow {
  return {
    b2bApprovalWorkflowId: row.b2bApprovalWorkflowId,
    b2bCompanyId: row.b2bCompanyId,
    name: row.name,
    description: row.description,
    workflowType: row.workflowType,
    isActive: Boolean(row.isActive),
    isDefault: Boolean(row.isDefault),
    priority: parseInt(row.priority) || 0,
    conditions: row.conditions || {},
    rules: row.rules || [],
    minAmount: row.minAmount ? parseFloat(row.minAmount) : undefined,
    maxAmount: row.maxAmount ? parseFloat(row.maxAmount) : undefined,
    currency: row.currency || 'USD',
    requiresAllApprovers: Boolean(row.requiresAllApprovers),
    autoApproveAfterHours: row.autoApproveAfterHours ? parseInt(row.autoApproveAfterHours) : undefined,
    autoRejectAfterExpiry: Boolean(row.autoRejectAfterExpiry),
    expiryHours: parseInt(row.expiryHours) || 72,
    notifyOnSubmit: Boolean(row.notifyOnSubmit),
    notifyOnApprove: Boolean(row.notifyOnApprove),
    notifyOnReject: Boolean(row.notifyOnReject),
    notifyRequester: Boolean(row.notifyRequester),
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
  };
}

function mapToWorkflowStep(row: Record<string, any>): B2bApprovalWorkflowStep {
  return {
    b2bApprovalWorkflowStepId: row.b2bApprovalWorkflowStepId,
    b2bApprovalWorkflowId: row.b2bApprovalWorkflowId,
    stepNumber: parseInt(row.stepNumber) || 1,
    name: row.name,
    description: row.description,
    approverType: row.approverType,
    approverId: row.approverId,
    approverRole: row.approverRole,
    approverIds: row.approverIds || [],
    requiresAll: Boolean(row.requiresAll),
    minApprovers: parseInt(row.minApprovers) || 1,
    timeoutHours: row.timeoutHours ? parseInt(row.timeoutHours) : undefined,
    escalateTo: row.escalateTo,
    escalateToUserId: row.escalateToUserId,
    canDelegate: Boolean(row.canDelegate),
    canSkip: Boolean(row.canSkip),
    conditions: row.conditions,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToApprovalRequest(row: Record<string, any>): B2bApprovalRequest {
  return {
    b2bApprovalRequestId: row.b2bApprovalRequestId,
    b2bApprovalWorkflowId: row.b2bApprovalWorkflowId,
    b2bCompanyId: row.b2bCompanyId,
    requestType: row.requestType,
    entityId: row.entityId,
    entityType: row.entityType,
    requesterId: row.requesterId,
    requesterType: row.requesterType,
    status: row.status,
    currentStep: parseInt(row.currentStep) || 1,
    totalSteps: parseInt(row.totalSteps) || 1,
    amount: row.amount ? parseFloat(row.amount) : undefined,
    currency: row.currency || 'USD',
    requestNotes: row.requestNotes,
    approvalNotes: row.approvalNotes,
    rejectionReason: row.rejectionReason,
    approvalHistory: row.approvalHistory || [],
    finalApproverId: row.finalApproverId,
    submittedAt: row.submittedAt ? new Date(row.submittedAt) : undefined,
    approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
    rejectedAt: row.rejectedAt ? new Date(row.rejectedAt) : undefined,
    cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToApprovalAction(row: Record<string, any>): B2bApprovalAction {
  return {
    b2bApprovalActionId: row.b2bApprovalActionId,
    b2bApprovalRequestId: row.b2bApprovalRequestId,
    b2bApprovalWorkflowStepId: row.b2bApprovalWorkflowStepId,
    stepNumber: parseInt(row.stepNumber) || 1,
    approverId: row.approverId,
    approverType: row.approverType,
    action: row.action,
    comment: row.comment,
    delegatedTo: row.delegatedTo,
    requestedInfo: row.requestedInfo,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    metadata: row.metadata,
    actionAt: new Date(row.actionAt),
    createdAt: new Date(row.createdAt),
  };
}
