import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { AppError, logCaughtError } from '../../../../libs/errors';
import { ManageCompanyUseCase, ManageB2BUserUseCase, ManageQuoteUseCase, ManageApprovalWorkflowUseCase } from '../../application/useCases';
import { PaymentTerms } from '../../domain/entities/Company';
import { B2BUserRole } from '../../domain/entities/B2BUser';

export class B2BController {
  // JWT API auth exposes the org id as user.id; session auth exposes organizationId
  private orgId(req: HttpRequest): string {
    return req.user?.organizationId ?? req.user?.id ?? '';
  }

  private actorId(req: HttpRequest): string {
    return req.user?.userId ?? req.user?.id ?? this.orgId(req);
  }

  private companyUseCase: ManageCompanyUseCase;
  private userUseCase: ManageB2BUserUseCase;
  private quoteUseCase: ManageQuoteUseCase;
  private approvalUseCase: ManageApprovalWorkflowUseCase;

  constructor(
    companyUseCase: ManageCompanyUseCase,
    userUseCase: ManageB2BUserUseCase,
    quoteUseCase: ManageQuoteUseCase,
    approvalUseCase: ManageApprovalWorkflowUseCase,
  ) {
    this.companyUseCase = companyUseCase;
    this.userUseCase = userUseCase;
    this.quoteUseCase = quoteUseCase;
    this.approvalUseCase = approvalUseCase;
  }

  /** Run a handler producing response `data`, translating domain errors to HTTP. */
  private async respond(res: HttpResponse, fn: () => Promise<unknown>, status = 200): Promise<void> {
    jsonResponse(res, status, { success: true, data: await fn() });
  }

  private handleError(res: HttpResponse, error: unknown): void {
    if (error instanceof AppError) {
      jsonResponse(res, error.statusCode, { success: false, error: error.message, code: error.code });
      return;
    }
    logCaughtError('B2B controller error', error);
    jsonResponse(res, 500, { success: false, error: 'Internal error' });
  }

  // ─── Company endpoints ───

  async listCompanies(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.companyUseCase.listByOrganization(this.orgId(req))).map(c => c.toJSON()));
  }

  async getCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.companyUseCase.get(req.params.companyId)).toJSON());
  }

  async createCompany(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(
      res,
      async () =>
        (
          await this.companyUseCase.create({
            ...(req.body as Record<string, unknown>),
            organizationId: this.orgId(req),
          } as Parameters<typeof this.companyUseCase.create>[0])
        ).toJSON(),
      201,
    );
  }

  async updateCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.companyUseCase.updateProfile(req.params.companyId, req.body as Parameters<typeof this.companyUseCase.updateProfile>[1])
      ).toJSON(),
    );
  }

  async setPaymentTerms(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.companyUseCase.setPaymentTerms(req.params.companyId, (req.body as Record<string, unknown>).paymentTerms as PaymentTerms)
      ).toJSON(),
    );
  }

  async setCreditLimit(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.companyUseCase.setCreditLimit(req.params.companyId, (req.body as Record<string, unknown>).creditLimitCents as number)
      ).toJSON(),
    );
  }

  async approveCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.companyUseCase.approve(req.params.companyId)).toJSON());
  }

  async suspendCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.companyUseCase.suspend(req.params.companyId)).toJSON());
  }

  async reactivateCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.companyUseCase.reactivate(req.params.companyId)).toJSON());
  }

  async terminateCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.companyUseCase.terminate(req.params.companyId)).toJSON());
  }

  async listSubsidiaries(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.companyUseCase.listSubsidiaries(req.params.companyId)).map(c => c.toJSON()));
  }

  // ─── B2B User endpoints ───

  async listUsers(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => {
      const { companyId } = req.query as { companyId?: string };
      const users = companyId
        ? await this.userUseCase.listByCompany(companyId)
        : await this.userUseCase.listByOrganization(this.orgId(req));
      return users.map(u => u.toJSON());
    });
  }

  async getUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.userUseCase.get(req.params.userId)).toJSON());
  }

  async inviteUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(
      res,
      async () =>
        (
          await this.userUseCase.invite({
            ...(req.body as Record<string, unknown>),
            organizationId: this.orgId(req),
          } as Parameters<typeof this.userUseCase.invite>[0])
        ).toJSON(),
      201,
    );
  }

  async activateUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.userUseCase.activate(req.params.userId)).toJSON());
  }

  async suspendUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.userUseCase.suspend(req.params.userId)).toJSON());
  }

  async reactivateUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.userUseCase.reactivate(req.params.userId)).toJSON());
  }

  async removeUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.userUseCase.remove(req.params.userId)).toJSON());
  }

  async setUserRole(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (await this.userUseCase.setRole(req.params.userId, (req.body as Record<string, unknown>).role as B2BUserRole)).toJSON(),
    );
  }

  async setSpendingLimits(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.userUseCase.setSpendingLimits(
          req.params.userId,
          (req.body as Record<string, unknown>).spendingLimits as Parameters<typeof this.userUseCase.setSpendingLimits>[1],
        )
      ).toJSON(),
    );
  }

  async updateUserProfile(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (await this.userUseCase.updateProfile(req.params.userId, req.body as Parameters<typeof this.userUseCase.updateProfile>[1])).toJSON(),
    );
  }

  // ─── Quote endpoints ───

  async listQuotes(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => {
      const { companyId, status } = req.query as { companyId?: string; status?: string };
      const organizationId = this.orgId(req);
      let quotes;
      if (status && organizationId) {
        quotes = await this.quoteUseCase.listByStatus(status, organizationId);
      } else if (companyId) {
        quotes = await this.quoteUseCase.listByCompany(companyId);
      } else {
        quotes = await this.quoteUseCase.listByOrganization(organizationId);
      }
      return quotes.map(q => q.toJSON());
    });
  }

  async getQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.quoteUseCase.get(req.params.quoteId)).toJSON());
  }

  async createQuote(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(
      res,
      async () =>
        (
          await this.quoteUseCase.create({
            ...(req.body as Record<string, unknown>),
            organizationId: this.orgId(req),
          } as Parameters<typeof this.quoteUseCase.create>[0])
        ).toJSON(),
      201,
    );
  }

  async addQuoteLineItem(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (await this.quoteUseCase.addLineItem(req.params.quoteId, req.body as Parameters<typeof this.quoteUseCase.addLineItem>[1])).toJSON(),
    );
  }

  async updateQuoteLineItem(req: HttpRequest<{ quoteId: string; lineItemId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.quoteUseCase.updateLineItem(
          req.params.quoteId,
          req.params.lineItemId,
          req.body as Parameters<typeof this.quoteUseCase.updateLineItem>[2],
        )
      ).toJSON(),
    );
  }

  async removeQuoteLineItem(req: HttpRequest<{ quoteId: string; lineItemId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.quoteUseCase.removeLineItem(req.params.quoteId, req.params.lineItemId)).toJSON());
  }

  async sendQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.quoteUseCase.send(req.params.quoteId)).toJSON());
  }

  async markQuoteViewed(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.quoteUseCase.markViewed(req.params.quoteId)).toJSON());
  }

  async acceptQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.quoteUseCase.accept(req.params.quoteId)).toJSON());
  }

  async rejectQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (await this.quoteUseCase.reject(req.params.quoteId, (req.body as Record<string, unknown>).reason as string)).toJSON(),
    );
  }

  async convertQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (await this.quoteUseCase.convert(req.params.quoteId, (req.body as Record<string, unknown>).orderId as string)).toJSON(),
    );
  }

  async setQuoteNotes(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (await this.quoteUseCase.setNotes(req.params.quoteId, (req.body as Record<string, unknown>).notes as string)).toJSON(),
    );
  }

  async setQuoteInternalNotes(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.quoteUseCase.setInternalNotes(req.params.quoteId, (req.body as Record<string, unknown>).internalNotes as string)
      ).toJSON(),
    );
  }

  // ─── Approval workflow endpoints ───

  async listApprovals(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => {
      const { companyId, approverId, pending } = req.query as { companyId?: string; approverId?: string; pending?: string };
      const organizationId = this.orgId(req);
      if (pending === 'true' && organizationId) {
        return (await this.approvalUseCase.listPendingByOrganization(organizationId)).map(w => w.toJSON());
      }
      if (approverId && organizationId) {
        return (await this.approvalUseCase.listByApprover(approverId, organizationId)).map(w => w.toJSON());
      }
      if (companyId) {
        return (await this.approvalUseCase.listByCompany(companyId)).map(w => w.toJSON());
      }
      return [];
    });
  }

  async getApproval(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.approvalUseCase.get(req.params.workflowId)).toJSON());
  }

  async createApproval(req: HttpRequest, res: HttpResponse): Promise<void> {
    await this.respond(
      res,
      async () =>
        (
          await this.approvalUseCase.create({
            ...(req.body as Record<string, unknown>),
            organizationId: this.orgId(req),
          } as Parameters<typeof this.approvalUseCase.create>[0])
        ).toJSON(),
      201,
    );
  }

  async approveWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.approvalUseCase.approve(
          req.params.workflowId,
          this.actorId(req),
          (req.body as Record<string, unknown>).comments as string,
        )
      ).toJSON(),
    );
  }

  async rejectWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () =>
      (
        await this.approvalUseCase.reject(
          req.params.workflowId,
          this.actorId(req),
          (req.body as Record<string, unknown>).comments as string,
        )
      ).toJSON(),
    );
  }

  async escalateWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.approvalUseCase.escalate(req.params.workflowId)).toJSON());
  }

  async cancelWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    await this.respond(res, async () => (await this.approvalUseCase.cancel(req.params.workflowId)).toJSON());
  }
}
