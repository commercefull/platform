import { AppError } from '../../../../libs/errors';

export class B2BValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, { code: 'b2b.validation_error', severity: 'warn', details });
  }
}

export class CompanyNotFoundError extends AppError {
  constructor(companyId: string) {
    super(`Company not found: ${companyId}`, 404, { code: 'b2b.company_not_found', details: { companyId } });
  }
}

export class CompanyAlreadyExistsError extends AppError {
  constructor(name: string) {
    super(`Company already exists: ${name}`, 409, { code: 'b2b.company_already_exists', details: { name } });
  }
}

export class CompanyStatusError extends AppError {
  constructor(companyId: string, action: string, currentStatus: string) {
    super(`Cannot ${action} company ${companyId} in status: ${currentStatus}`, 409, { code: 'b2b.company_status_error', severity: 'warn', details: { companyId, action, currentStatus } });
  }
}

export class B2BUserNotFoundError extends AppError {
  constructor(userId: string) {
    super(`B2B user not found: ${userId}`, 404, { code: 'b2b.user_not_found', details: { userId } });
  }
}

export class B2BUserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`B2B user already exists: ${email}`, 409, { code: 'b2b.user_already_exists', details: { email } });
  }
}

export class B2BUserStatusError extends AppError {
  constructor(userId: string, action: string, currentStatus: string) {
    super(`Cannot ${action} user ${userId} in status: ${currentStatus}`, 409, { code: 'b2b.user_status_error', severity: 'warn', details: { userId, action, currentStatus } });
  }
}

export class SpendingLimitExceededError extends AppError {
  constructor(userId: string, amount: number, limit: number) {
    super(`Spending limit exceeded for user ${userId}: ${amount} exceeds limit ${limit}`, 403, { code: 'b2b.spending_limit_exceeded', severity: 'warn', details: { userId, amount, limit } });
  }
}

export class QuoteNotFoundError extends AppError {
  constructor(quoteId: string) {
    super(`Quote not found: ${quoteId}`, 404, { code: 'b2b.quote_not_found', details: { quoteId } });
  }
}

export class QuoteStatusError extends AppError {
  constructor(quoteId: string, action: string, currentStatus: string) {
    super(`Cannot ${action} quote ${quoteId} in status: ${currentStatus}`, 409, { code: 'b2b.quote_status_error', severity: 'warn', details: { quoteId, action, currentStatus } });
  }
}

export class QuoteExpiredError extends AppError {
  constructor(quoteId: string) {
    super(`Quote has expired: ${quoteId}`, 410, { code: 'b2b.quote_expired', details: { quoteId } });
  }
}

export class ApprovalWorkflowNotFoundError extends AppError {
  constructor(workflowId: string) {
    super(`Approval workflow not found: ${workflowId}`, 404, { code: 'b2b.approval_not_found', details: { workflowId } });
  }
}

export class ApprovalStatusError extends AppError {
  constructor(workflowId: string, action: string, currentStatus: string) {
    super(`Cannot ${action} approval workflow ${workflowId} in status: ${currentStatus}`, 409, { code: 'b2b.approval_status_error', severity: 'warn', details: { workflowId, action, currentStatus } });
  }
}

export class UnauthorizedApproverError extends AppError {
  constructor(workflowId: string, approverId: string) {
    super(`User ${approverId} is not the current approver for workflow ${workflowId}`, 403, { code: 'b2b.unauthorized_approver', severity: 'warn', details: { workflowId, approverId } });
  }
}

export class CreditLimitExceededError extends AppError {
  constructor(companyId: string, amount: number, available: number) {
    super(`Credit limit exceeded for company ${companyId}: requested ${amount}, available ${available}`, 403, { code: 'b2b.credit_limit_exceeded', severity: 'warn', details: { companyId, amount, available } });
  }
}
