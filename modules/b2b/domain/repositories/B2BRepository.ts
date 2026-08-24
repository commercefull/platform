import { Company } from '../entities/Company';
import { B2BUser } from '../entities/B2BUser';
import { Quote } from '../entities/Quote';
import { ApprovalWorkflow } from '../entities/ApprovalWorkflow';

export interface CompanyRepository {
  findById(companyId: string): Promise<Company | null>;
  findByOrganizationId(organizationId: string): Promise<Company[]>;
  findByName(name: string, organizationId: string): Promise<Company | null>;
  findByParentId(parentId: string): Promise<Company[]>;
  save(company: Company): Promise<void>;
  delete(companyId: string): Promise<void>;
}

export interface B2BUserRepository {
  findById(userId: string): Promise<B2BUser | null>;
  findByEmail(email: string, companyId: string): Promise<B2BUser | null>;
  findByCompanyId(companyId: string): Promise<B2BUser[]>;
  findByOrganizationId(organizationId: string): Promise<B2BUser[]>;
  save(user: B2BUser): Promise<void>;
  delete(userId: string): Promise<void>;
}

export interface QuoteRepository {
  findById(quoteId: string): Promise<Quote | null>;
  findByQuoteNumber(quoteNumber: string): Promise<Quote | null>;
  findByCompanyId(companyId: string): Promise<Quote[]>;
  findByOrganizationId(organizationId: string): Promise<Quote[]>;
  findByStatus(status: string, organizationId: string): Promise<Quote[]>;
  save(quote: Quote): Promise<void>;
  delete(quoteId: string): Promise<void>;
}

export interface ApprovalWorkflowRepository {
  findById(workflowId: string): Promise<ApprovalWorkflow | null>;
  findByReferenceId(referenceId: string): Promise<ApprovalWorkflow | null>;
  findByCompanyId(companyId: string): Promise<ApprovalWorkflow[]>;
  findByOrganizationId(organizationId: string): Promise<ApprovalWorkflow[]>;
  findByApproverId(approverId: string, organizationId: string): Promise<ApprovalWorkflow[]>;
  findPendingByOrganizationId(organizationId: string): Promise<ApprovalWorkflow[]>;
  save(workflow: ApprovalWorkflow): Promise<void>;
  delete(workflowId: string): Promise<void>;
}
