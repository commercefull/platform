import { query, queryOne } from '../../../../libs/db';
import { ApprovalWorkflow, ApprovalWorkflowProps } from '../../domain/entities/ApprovalWorkflow';
import type { ApprovalWorkflowRepository } from '../../domain/repositories/B2BRepository';

export class ApprovalWorkflowRepositoryImpl implements ApprovalWorkflowRepository {
  async findById(workflowId: string): Promise<ApprovalWorkflow | null> {
    const row = await queryOne<ApprovalWorkflowProps>(
      `SELECT * FROM "b2bApprovalWorkflow" WHERE "workflowId" = $1`,
      [workflowId],
    );
    return row ? ApprovalWorkflow.reconstitute(row) : null;
  }

  async findByReferenceId(referenceId: string): Promise<ApprovalWorkflow | null> {
    const row = await queryOne<ApprovalWorkflowProps>(
      `SELECT * FROM "b2bApprovalWorkflow" WHERE "referenceId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [referenceId],
    );
    return row ? ApprovalWorkflow.reconstitute(row) : null;
  }

  async findByCompanyId(companyId: string): Promise<ApprovalWorkflow[]> {
    const rows = await query<ApprovalWorkflowProps[]>(
      `SELECT * FROM "b2bApprovalWorkflow" WHERE "companyId" = $1 ORDER BY "createdAt" DESC`,
      [companyId],
    );
    return (rows ?? []).map(r => ApprovalWorkflow.reconstitute(r));
  }

  async findByOrganizationId(organizationId: string): Promise<ApprovalWorkflow[]> {
    const rows = await query<ApprovalWorkflowProps[]>(
      `SELECT * FROM "b2bApprovalWorkflow" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => ApprovalWorkflow.reconstitute(r));
  }

  async findByApproverId(approverId: string, organizationId: string): Promise<ApprovalWorkflow[]> {
    const rows = await query<ApprovalWorkflowProps[]>(
      `SELECT * FROM "b2bApprovalWorkflow"
       WHERE "organizationId" = $1
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements("steps") AS step
         WHERE step->>'approverId' = $2 AND step->>'status' = 'pending'
       )
       ORDER BY "createdAt" DESC`,
      [organizationId, approverId],
    );
    return (rows ?? []).map(r => ApprovalWorkflow.reconstitute(r));
  }

  async findPendingByOrganizationId(organizationId: string): Promise<ApprovalWorkflow[]> {
    const rows = await query<ApprovalWorkflowProps[]>(
      `SELECT * FROM "b2bApprovalWorkflow" WHERE "organizationId" = $1 AND "status" = 'pending' ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => ApprovalWorkflow.reconstitute(r));
  }

  async save(workflow: ApprovalWorkflow): Promise<void> {
    const json = workflow.toJSON();
    await query(
      `INSERT INTO "b2bApprovalWorkflow" (
        "workflowId", "companyId", "organizationId", "type", "referenceId",
        "referenceNumber", "requestedBy", "requestedByEmail", "status",
        "amount", "currency", "steps", "currentStep", "description",
        "createdAt", "updatedAt", "completedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT ("workflowId") DO UPDATE SET
        "status" = EXCLUDED."status",
        "steps" = EXCLUDED."steps",
        "currentStep" = EXCLUDED."currentStep",
        "completedAt" = EXCLUDED."completedAt",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      [
        json.workflowId, json.companyId, json.organizationId, json.type,
        json.referenceId, json.referenceNumber, json.requestedBy,
        json.requestedByEmail, json.status, json.amount, json.currency,
        JSON.stringify(json.steps), json.currentStep, json.description ?? null,
        json.createdAt, json.updatedAt, json.completedAt ?? null,
      ],
    );
  }

  async delete(workflowId: string): Promise<void> {
    await query(`DELETE FROM "b2bApprovalWorkflow" WHERE "workflowId" = $1`, [workflowId]);
  }
}
