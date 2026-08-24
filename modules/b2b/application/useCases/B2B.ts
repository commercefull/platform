import { Company, PaymentTerms } from '../../domain/entities/Company';
import { B2BUser, B2BUserRole, SpendingLimit } from '../../domain/entities/B2BUser';
import { Quote, QuoteLineItem } from '../../domain/entities/Quote';
import { ApprovalWorkflow, ApprovalType } from '../../domain/entities/ApprovalWorkflow';
import {
  CompanyRepository,
  B2BUserRepository,
  QuoteRepository,
  ApprovalWorkflowRepository,
} from '../../domain/repositories/B2BRepository';
import {
  CompanyNotFoundError,
  CompanyAlreadyExistsError,
  CompanyStatusError,
  B2BUserNotFoundError,
  B2BUserAlreadyExistsError,
  B2BUserStatusError,
  SpendingLimitExceededError,
  QuoteNotFoundError,
  QuoteExpiredError,
  ApprovalWorkflowNotFoundError,
  UnauthorizedApproverError,
  CreditLimitExceededError,
  B2BValidationError,
} from '../../domain/errors/B2BErrors';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

// ─── Company Use Cases ───

export class ManageCompanyUseCase {
  constructor(private companyRepo: CompanyRepository) {}

  async create(input: {
    organizationId: string;
    name: string;
    legalName?: string;
    taxId?: string;
    paymentTerms?: PaymentTerms;
    creditLimit?: number;
    billingAddress?: Company['billingAddress'];
    shippingAddress?: Company['shippingAddress'];
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    parentId?: string;
  }): Promise<Company> {
    const existing = await this.companyRepo.findByName(input.name, input.organizationId);
    if (existing) throw new CompanyAlreadyExistsError(input.name);

    const company = Company.create(input);
    await this.companyRepo.save(company);
    await eventBus.emit('company.registered', { companyId: company.companyId, organizationId: company.organizationId, name: company.name });
    logger.info('Company created', { companyId: company.companyId, name: company.name });
    return company;
  }

  async get(companyId: string): Promise<Company> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new CompanyNotFoundError(companyId);
    return company;
  }

  async listByOrganization(organizationId: string): Promise<Company[]> {
    return this.companyRepo.findByOrganizationId(organizationId);
  }

  async listSubsidiaries(parentId: string): Promise<Company[]> {
    return this.companyRepo.findByParentId(parentId);
  }

  async updateProfile(companyId: string, updates: {
    name?: string;
    legalName?: string;
    taxId?: string;
    billingAddress?: Company['billingAddress'];
    shippingAddress?: Company['shippingAddress'];
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  }): Promise<Company> {
    const company = await this.get(companyId);
    company.updateProfile(updates);
    await this.companyRepo.save(company);
    return company;
  }

  async setPaymentTerms(companyId: string, terms: PaymentTerms): Promise<Company> {
    const company = await this.get(companyId);
    company.setPaymentTerms(terms);
    await this.companyRepo.save(company);
    return company;
  }

  async setCreditLimit(companyId: string, limit: number): Promise<Company> {
    const company = await this.get(companyId);
    company.setCreditLimit(limit);
    await this.companyRepo.save(company);
    return company;
  }

  async approve(companyId: string): Promise<Company> {
    const company = await this.get(companyId);
    if (company.status !== 'pending') throw new CompanyStatusError(companyId, 'approve', company.status);
    company.approve();
    await this.companyRepo.save(company);
    await eventBus.emit('company.approved', { companyId: company.companyId, organizationId: company.organizationId });
    return company;
  }

  async suspend(companyId: string): Promise<Company> {
    const company = await this.get(companyId);
    company.suspend();
    await this.companyRepo.save(company);
    await eventBus.emit('company.suspended', { companyId: company.companyId });
    return company;
  }

  async reactivate(companyId: string): Promise<Company> {
    const company = await this.get(companyId);
    company.reactivate();
    await this.companyRepo.save(company);
    return company;
  }

  async terminate(companyId: string): Promise<Company> {
    const company = await this.get(companyId);
    company.terminate();
    await this.companyRepo.save(company);
    return company;
  }

  async checkCredit(companyId: string, amount: number): Promise<boolean> {
    const company = await this.get(companyId);
    if (!company.hasAvailableCredit(amount)) {
      const available = (company.creditLimit ?? 0) - company.outstandingBalance;
      throw new CreditLimitExceededError(companyId, amount, available);
    }
    return true;
  }
}

// ─── B2B User Use Cases ───

export class ManageB2BUserUseCase {
  constructor(
    private userRepo: B2BUserRepository,
    private companyRepo: CompanyRepository,
  ) {}

  async invite(input: {
    companyId: string;
    organizationId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: B2BUserRole;
    spendingLimits?: SpendingLimit;
    department?: string;
    costCenter?: string;
  }): Promise<B2BUser> {
    const company = await this.companyRepo.findById(input.companyId);
    if (!company) throw new CompanyNotFoundError(input.companyId);

    const existing = await this.userRepo.findByEmail(input.email, input.companyId);
    if (existing) throw new B2BUserAlreadyExistsError(input.email);

    const user = B2BUser.create(input);
    await this.userRepo.save(user);
    await eventBus.emit('company.user.invited', { userId: user.userId, companyId: user.companyId, email: user.email });
    return user;
  }

  async get(userId: string): Promise<B2BUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new B2BUserNotFoundError(userId);
    return user;
  }

  async listByCompany(companyId: string): Promise<B2BUser[]> {
    return this.userRepo.findByCompanyId(companyId);
  }

  async listByOrganization(organizationId: string): Promise<B2BUser[]> {
    return this.userRepo.findByOrganizationId(organizationId);
  }

  async activate(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.activate();
    await this.userRepo.save(user);
    await eventBus.emit('b2b_user.activated', { userId: user.userId, companyId: user.companyId });
    return user;
  }

  async suspend(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.suspend();
    await this.userRepo.save(user);
    return user;
  }

  async reactivate(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.reactivate();
    await this.userRepo.save(user);
    return user;
  }

  async remove(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.remove();
    await this.userRepo.save(user);
    return user;
  }

  async setRole(userId: string, role: B2BUserRole): Promise<B2BUser> {
    const user = await this.get(userId);
    user.setRole(role);
    await this.userRepo.save(user);
    return user;
  }

  async setSpendingLimits(userId: string, limits: SpendingLimit): Promise<B2BUser> {
    const user = await this.get(userId);
    user.setSpendingLimits(limits);
    await this.userRepo.save(user);
    return user;
  }

  async updateProfile(userId: string, updates: {
    firstName?: string;
    lastName?: string;
    department?: string;
    costCenter?: string;
  }): Promise<B2BUser> {
    const user = await this.get(userId);
    user.updateProfile(updates);
    await this.userRepo.save(user);
    return user;
  }

  async recordLogin(userId: string): Promise<void> {
    const user = await this.get(userId);
    user.recordLogin();
    await this.userRepo.save(user);
  }

  async checkSpendingLimit(userId: string, amount: number, periodSpent: number, period: keyof SpendingLimit): Promise<boolean> {
    const user = await this.get(userId);
    if (!user.isActive) throw new B2BUserStatusError(userId, 'place order', user.status);
    const limit = user.spendingLimits[period];
    if (limit !== undefined && periodSpent + amount > limit) {
      throw new SpendingLimitExceededError(userId, amount, limit);
    }
    return true;
  }
}

// ─── Quote Use Cases ───

export class ManageQuoteUseCase {
  constructor(private quoteRepo: QuoteRepository) {}

  async create(input: {
    companyId: string;
    organizationId: string;
    requestedBy: string;
    currency?: string;
    validUntilDays?: number;
    notes?: string;
  }): Promise<Quote> {
    const quote = Quote.create(input);
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.created', { quoteId: quote.quoteId, companyId: quote.companyId, quoteNumber: quote.quoteNumber });
    return quote;
  }

  async get(quoteId: string): Promise<Quote> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) throw new QuoteNotFoundError(quoteId);
    return quote;
  }

  async getByQuoteNumber(quoteNumber: string): Promise<Quote> {
    const quote = await this.quoteRepo.findByQuoteNumber(quoteNumber);
    if (!quote) throw new QuoteNotFoundError(quoteNumber);
    return quote;
  }

  async listByCompany(companyId: string): Promise<Quote[]> {
    return this.quoteRepo.findByCompanyId(companyId);
  }

  async listByOrganization(organizationId: string): Promise<Quote[]> {
    return this.quoteRepo.findByOrganizationId(organizationId);
  }

  async listByStatus(status: string, organizationId: string): Promise<Quote[]> {
    return this.quoteRepo.findByStatus(status, organizationId);
  }

  async addLineItem(quoteId: string, item: Omit<QuoteLineItem, 'lineItemId'>): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.addLineItem(item);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async updateLineItem(quoteId: string, lineItemId: string, updates: Partial<Omit<QuoteLineItem, 'lineItemId'>>): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.updateLineItem(lineItemId, updates);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async removeLineItem(quoteId: string, lineItemId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.removeLineItem(lineItemId);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async send(quoteId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.send();
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.sent', { quoteId: quote.quoteId, companyId: quote.companyId, quoteNumber: quote.quoteNumber });
    return quote;
  }

  async markViewed(quoteId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.markViewed();
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.viewed', { quoteId: quote.quoteId });
    return quote;
  }

  async accept(quoteId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    if (quote.isExpired) throw new QuoteExpiredError(quoteId);
    quote.accept();
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.accepted', { quoteId: quote.quoteId, companyId: quote.companyId, total: quote.total });
    return quote;
  }

  async reject(quoteId: string, reason?: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.reject(reason);
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.rejected', { quoteId: quote.quoteId, reason });
    return quote;
  }

  async convert(quoteId: string, orderId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.convert(orderId);
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.converted', { quoteId: quote.quoteId, orderId });
    return quote;
  }

  async setNotes(quoteId: string, notes: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.setNotes(notes);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async setInternalNotes(quoteId: string, notes: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.setInternalNotes(notes);
    await this.quoteRepo.save(quote);
    return quote;
  }
}

// ─── Approval Workflow Use Cases ───

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
