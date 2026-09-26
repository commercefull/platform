import type { HttpRequest, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import {
  ManageCompanyUseCase,
  ManageB2BUserUseCase,
  ManageQuoteUseCase,
  ManageApprovalWorkflowUseCase,
} from '../../application/useCases';
import { PaymentTerms } from '../../domain/entities/Company';
import { B2BUserRole } from '../../domain/entities/B2BUser';
import {
  CompanyNotFoundError,
  CompanyAlreadyExistsError,
  CompanyStatusError,
  B2BUserNotFoundError,
  B2BUserAlreadyExistsError,
  B2BUserStatusError,
  SpendingLimitExceededError,
  QuoteNotFoundError,
  QuoteStatusError,
  QuoteExpiredError,
  ApprovalWorkflowNotFoundError,
  ApprovalStatusError,
  UnauthorizedApproverError,
  CreditLimitExceededError,
  B2BValidationError,
} from '../../domain/errors/B2BErrors';

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

  private handleError(res: HttpResponse, error: unknown): void {
    if (
      error instanceof CompanyNotFoundError ||
      error instanceof B2BUserNotFoundError ||
      error instanceof QuoteNotFoundError ||
      error instanceof ApprovalWorkflowNotFoundError
    ) {
      res.status(404).json({ success: false, error: error.message, code: error.code });
    } else if (
      error instanceof CompanyAlreadyExistsError ||
      error instanceof B2BUserAlreadyExistsError ||
      error instanceof CompanyStatusError ||
      error instanceof B2BUserStatusError ||
      error instanceof QuoteStatusError ||
      error instanceof ApprovalStatusError
    ) {
      res.status(409).json({ success: false, error: error.message, code: error.code });
    } else if (
      error instanceof SpendingLimitExceededError ||
      error instanceof CreditLimitExceededError ||
      error instanceof UnauthorizedApproverError
    ) {
      res.status(403).json({ success: false, error: error.message, code: error.code });
    } else if (error instanceof QuoteExpiredError) {
      res.status(410).json({ success: false, error: error.message, code: error.code });
    } else if (error instanceof B2BValidationError) {
      res.status(400).json({ success: false, error: error.message, code: error.code });
    } else {
      logger.error('B2B controller error', { error: (error as Error).message, stack: (error as Error).stack });
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }

  // ─── Company endpoints ───

  async listCompanies(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.orgId(req);
      const companies = await this.companyUseCase.listByOrganization(organizationId);
      res.json({ success: true, data: companies.map(c => c.toJSON()) });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.get(req.params.companyId);
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createCompany(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.orgId(req);
      const company = await this.companyUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<
        typeof this.companyUseCase.create
      >[0]);
      res.status(201).json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.updateProfile(
        req.params.companyId,
        req.body as Parameters<typeof this.companyUseCase.updateProfile>[1],
      );
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setPaymentTerms(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.setPaymentTerms(
        req.params.companyId,
        (req.body as Record<string, unknown>).paymentTerms as PaymentTerms,
      );
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setCreditLimit(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.setCreditLimit(
        req.params.companyId,
        (req.body as Record<string, unknown>).creditLimitCents as number,
      );
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async approveCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.approve(req.params.companyId);
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async suspendCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.suspend(req.params.companyId);
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async reactivateCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.reactivate(req.params.companyId);
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async terminateCompany(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const company = await this.companyUseCase.terminate(req.params.companyId);
      res.json({ success: true, data: company.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async listSubsidiaries(req: HttpRequest<{ companyId: string }>, res: HttpResponse): Promise<void> {
    try {
      const companies = await this.companyUseCase.listSubsidiaries(req.params.companyId);
      res.json({ success: true, data: companies.map(c => c.toJSON()) });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── B2B User endpoints ───

  async listUsers(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { companyId } = req.query as { companyId?: string };
      const organizationId = this.orgId(req);
      if (companyId) {
        const users = await this.userUseCase.listByCompany(companyId);
        res.json({ success: true, data: users.map(u => u.toJSON()) });
      } else {
        const users = await this.userUseCase.listByOrganization(organizationId);
        res.json({ success: true, data: users.map(u => u.toJSON()) });
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.get(req.params.userId);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async inviteUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.orgId(req);
      const user = await this.userUseCase.invite({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<
        typeof this.userUseCase.invite
      >[0]);
      res.status(201).json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async activateUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.activate(req.params.userId);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async suspendUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.suspend(req.params.userId);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async reactivateUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.reactivate(req.params.userId);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async removeUser(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.remove(req.params.userId);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setUserRole(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.setRole(req.params.userId, (req.body as Record<string, unknown>).role as B2BUserRole);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setSpendingLimits(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.setSpendingLimits(
        req.params.userId,
        (req.body as Record<string, unknown>).spendingLimits as Parameters<typeof this.userUseCase.setSpendingLimits>[1],
      );
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateUserProfile(req: HttpRequest<{ userId: string }>, res: HttpResponse): Promise<void> {
    try {
      const user = await this.userUseCase.updateProfile(
        req.params.userId,
        req.body as Parameters<typeof this.userUseCase.updateProfile>[1],
      );
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── Quote endpoints ───

  async listQuotes(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { companyId, status } = req.query as { companyId?: string; status?: string };
      const organizationId = this.orgId(req);
      if (status && organizationId) {
        const quotes = await this.quoteUseCase.listByStatus(status, organizationId);
        res.json({ success: true, data: quotes.map(q => q.toJSON()) });
      } else if (companyId) {
        const quotes = await this.quoteUseCase.listByCompany(companyId);
        res.json({ success: true, data: quotes.map(q => q.toJSON()) });
      } else {
        const quotes = await this.quoteUseCase.listByOrganization(organizationId);
        res.json({ success: true, data: quotes.map(q => q.toJSON()) });
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.get(req.params.quoteId);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createQuote(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.orgId(req);
      const quote = await this.quoteUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<
        typeof this.quoteUseCase.create
      >[0]);
      res.status(201).json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async addQuoteLineItem(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.addLineItem(
        req.params.quoteId,
        req.body as Parameters<typeof this.quoteUseCase.addLineItem>[1],
      );
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateQuoteLineItem(req: HttpRequest<{ quoteId: string; lineItemId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.updateLineItem(
        req.params.quoteId,
        req.params.lineItemId,
        req.body as Parameters<typeof this.quoteUseCase.updateLineItem>[2],
      );
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async removeQuoteLineItem(req: HttpRequest<{ quoteId: string; lineItemId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.removeLineItem(req.params.quoteId, req.params.lineItemId);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async sendQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.send(req.params.quoteId);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async markQuoteViewed(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.markViewed(req.params.quoteId);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async acceptQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.accept(req.params.quoteId);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async rejectQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.reject(req.params.quoteId, (req.body as Record<string, unknown>).reason as string);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async convertQuote(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.convert(req.params.quoteId, (req.body as Record<string, unknown>).orderId as string);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setQuoteNotes(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.setNotes(req.params.quoteId, (req.body as Record<string, unknown>).notes as string);
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setQuoteInternalNotes(req: HttpRequest<{ quoteId: string }>, res: HttpResponse): Promise<void> {
    try {
      const quote = await this.quoteUseCase.setInternalNotes(
        req.params.quoteId,
        (req.body as Record<string, unknown>).internalNotes as string,
      );
      res.json({ success: true, data: quote.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── Approval workflow endpoints ───

  async listApprovals(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { companyId, approverId, pending } = req.query as { companyId?: string; approverId?: string; pending?: string };
      const organizationId = this.orgId(req);
      if (pending === 'true' && organizationId) {
        const workflows = await this.approvalUseCase.listPendingByOrganization(organizationId);
        res.json({ success: true, data: workflows.map(w => w.toJSON()) });
      } else if (approverId && organizationId) {
        const workflows = await this.approvalUseCase.listByApprover(approverId, organizationId);
        res.json({ success: true, data: workflows.map(w => w.toJSON()) });
      } else if (companyId) {
        const workflows = await this.approvalUseCase.listByCompany(companyId);
        res.json({ success: true, data: workflows.map(w => w.toJSON()) });
      } else {
        res.json({ success: true, data: [] });
      }
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getApproval(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    try {
      const workflow = await this.approvalUseCase.get(req.params.workflowId);
      res.json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createApproval(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.orgId(req);
      const workflow = await this.approvalUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<
        typeof this.approvalUseCase.create
      >[0]);
      res.status(201).json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async approveWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    try {
      const approverId = this.actorId(req);
      const workflow = await this.approvalUseCase.approve(
        req.params.workflowId,
        approverId,
        (req.body as Record<string, unknown>).comments as string,
      );
      res.json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async rejectWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    try {
      const approverId = this.actorId(req);
      const workflow = await this.approvalUseCase.reject(
        req.params.workflowId,
        approverId,
        (req.body as Record<string, unknown>).comments as string,
      );
      res.json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async escalateWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    try {
      const workflow = await this.approvalUseCase.escalate(req.params.workflowId);
      res.json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async cancelWorkflow(req: HttpRequest<{ workflowId: string }>, res: HttpResponse): Promise<void> {
    try {
      const workflow = await this.approvalUseCase.cancel(req.params.workflowId);
      res.json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
