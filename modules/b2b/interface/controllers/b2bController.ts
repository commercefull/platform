import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { ManageCompanyUseCase, ManageB2BUserUseCase, ManageQuoteUseCase, ManageApprovalWorkflowUseCase } from '../../application/useCases';
import { PaymentTerms } from '../../domain/entities/Company';
import { B2BUserRole } from '../../domain/entities/B2BUser';

export class B2BController {
  // JWT API auth exposes the org id as user.id; session auth exposes organizationId
  private orgId = (req: HttpRequest): string => {
    return req.user?.organizationId ?? req.user?.id ?? '';
  };

  private actorId = (req: HttpRequest): string => {
    return req.user?.userId ?? req.user?.id ?? this.orgId(req);
  };

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

  // ─── Company endpoints ───

  listCompanies = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.companyUseCase.listByOrganization(this.orgId(req))).map(c => c.toJSON()) });
  };

  getCompany = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.companyUseCase.get(req.params.companyId)).toJSON() });
  };

  createCompany = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 201, {
      success: true,
      data: (
        await this.companyUseCase.create({
          ...(req.body as Record<string, unknown>),
          organizationId: this.orgId(req),
        } as Parameters<typeof this.companyUseCase.create>[0])
      ).toJSON(),
    });
  };

  updateCompany = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.companyUseCase.updateProfile(req.params.companyId, req.body as Parameters<typeof this.companyUseCase.updateProfile>[1])
      ).toJSON(),
    });
  };

  setPaymentTerms = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.companyUseCase.setPaymentTerms(req.params.companyId, (req.body as Record<string, unknown>).paymentTerms as PaymentTerms)
      ).toJSON(),
    });
  };

  setCreditLimit = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.companyUseCase.setCreditLimit(req.params.companyId, (req.body as Record<string, unknown>).creditLimitCents as number)
      ).toJSON(),
    });
  };

  approveCompany = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.companyUseCase.approve(req.params.companyId)).toJSON() });
  };

  suspendCompany = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.companyUseCase.suspend(req.params.companyId)).toJSON() });
  };

  reactivateCompany = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.companyUseCase.reactivate(req.params.companyId)).toJSON() });
  };

  terminateCompany = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.companyUseCase.terminate(req.params.companyId)).toJSON() });
  };

  listSubsidiaries = async (req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (await this.companyUseCase.listSubsidiaries(req.params.companyId)).map(c => c.toJSON()),
    });
  };

  // ─── B2B User endpoints ───

  listUsers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { companyId } = req.query as { companyId?: string };
    const users = companyId ? await this.userUseCase.listByCompany(companyId) : await this.userUseCase.listByOrganization(this.orgId(req));
    jsonResponse(res, 200, { success: true, data: users.map(u => u.toJSON()) });
  };

  getUser = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.userUseCase.get(req.params.userId)).toJSON() });
  };

  inviteUser = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 201, {
      success: true,
      data: (
        await this.userUseCase.invite({
          ...(req.body as Record<string, unknown>),
          organizationId: this.orgId(req),
        } as Parameters<typeof this.userUseCase.invite>[0])
      ).toJSON(),
    });
  };

  activateUser = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.userUseCase.activate(req.params.userId)).toJSON() });
  };

  suspendUser = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.userUseCase.suspend(req.params.userId)).toJSON() });
  };

  reactivateUser = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.userUseCase.reactivate(req.params.userId)).toJSON() });
  };

  removeUser = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.userUseCase.remove(req.params.userId)).toJSON() });
  };

  setUserRole = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (await this.userUseCase.setRole(req.params.userId, (req.body as Record<string, unknown>).role as B2BUserRole)).toJSON(),
    });
  };

  setSpendingLimits = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.userUseCase.setSpendingLimits(
          req.params.userId,
          (req.body as Record<string, unknown>).spendingLimits as Parameters<typeof this.userUseCase.setSpendingLimits>[1],
        )
      ).toJSON(),
    });
  };

  updateUserProfile = async (req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.userUseCase.updateProfile(req.params.userId, req.body as Parameters<typeof this.userUseCase.updateProfile>[1])
      ).toJSON(),
    });
  };

  // ─── Quote endpoints ───

  listQuotes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
    jsonResponse(res, 200, { success: true, data: quotes.map(q => q.toJSON()) });
  };

  getQuote = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.quoteUseCase.get(req.params.quoteId)).toJSON() });
  };

  createQuote = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 201, {
      success: true,
      data: (
        await this.quoteUseCase.create({
          ...(req.body as Record<string, unknown>),
          organizationId: this.orgId(req),
        } as Parameters<typeof this.quoteUseCase.create>[0])
      ).toJSON(),
    });
  };

  addQuoteLineItem = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.quoteUseCase.addLineItem(req.params.quoteId, req.body as Parameters<typeof this.quoteUseCase.addLineItem>[1])
      ).toJSON(),
    });
  };

  updateQuoteLineItem = async (req: HttpRequest<{ quoteId: string; lineItemId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.quoteUseCase.updateLineItem(
          req.params.quoteId,
          req.params.lineItemId,
          req.body as Parameters<typeof this.quoteUseCase.updateLineItem>[2],
        )
      ).toJSON(),
    });
  };

  removeQuoteLineItem = async (req: HttpRequest<{ quoteId: string; lineItemId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (await this.quoteUseCase.removeLineItem(req.params.quoteId, req.params.lineItemId)).toJSON(),
    });
  };

  sendQuote = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.quoteUseCase.send(req.params.quoteId)).toJSON() });
  };

  markQuoteViewed = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.quoteUseCase.markViewed(req.params.quoteId)).toJSON() });
  };

  acceptQuote = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.quoteUseCase.accept(req.params.quoteId)).toJSON() });
  };

  rejectQuote = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (await this.quoteUseCase.reject(req.params.quoteId, (req.body as Record<string, unknown>).reason as string)).toJSON(),
    });
  };

  convertQuote = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (await this.quoteUseCase.convert(req.params.quoteId, (req.body as Record<string, unknown>).orderId as string)).toJSON(),
    });
  };

  setQuoteNotes = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (await this.quoteUseCase.setNotes(req.params.quoteId, (req.body as Record<string, unknown>).notes as string)).toJSON(),
    });
  };

  setQuoteInternalNotes = async (req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.quoteUseCase.setInternalNotes(req.params.quoteId, (req.body as Record<string, unknown>).internalNotes as string)
      ).toJSON(),
    });
  };

  // ─── Approval workflow endpoints ───

  listApprovals = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { companyId, approverId, pending } = req.query as { companyId?: string; approverId?: string; pending?: string };
    const organizationId = this.orgId(req);
    let workflows: Awaited<ReturnType<typeof this.approvalUseCase.listByCompany>>;
    if (pending === 'true' && organizationId) {
      workflows = await this.approvalUseCase.listPendingByOrganization(organizationId);
    } else if (approverId && organizationId) {
      workflows = await this.approvalUseCase.listByApprover(approverId, organizationId);
    } else if (companyId) {
      workflows = await this.approvalUseCase.listByCompany(companyId);
    } else {
      workflows = [];
    }
    jsonResponse(res, 200, { success: true, data: workflows.map(w => w.toJSON()) });
  };

  getApproval = async (req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.approvalUseCase.get(req.params.workflowId)).toJSON() });
  };

  createApproval = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 201, {
      success: true,
      data: (
        await this.approvalUseCase.create({
          ...(req.body as Record<string, unknown>),
          organizationId: this.orgId(req),
        } as Parameters<typeof this.approvalUseCase.create>[0])
      ).toJSON(),
    });
  };

  approveWorkflow = async (req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.approvalUseCase.approve(
          req.params.workflowId,
          this.actorId(req),
          (req.body as Record<string, unknown>).comments as string,
        )
      ).toJSON(),
    });
  };

  rejectWorkflow = async (req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, {
      success: true,
      data: (
        await this.approvalUseCase.reject(
          req.params.workflowId,
          this.actorId(req),
          (req.body as Record<string, unknown>).comments as string,
        )
      ).toJSON(),
    });
  };

  escalateWorkflow = async (req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.approvalUseCase.escalate(req.params.workflowId)).toJSON() });
  };

  cancelWorkflow = async (req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> => {
    jsonResponse(res, 200, { success: true, data: (await this.approvalUseCase.cancel(req.params.workflowId)).toJSON() });
  };
}
