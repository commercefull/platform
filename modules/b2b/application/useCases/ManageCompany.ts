import { Company, PaymentTerms } from '../../domain/entities/Company';
import { CompanyRepository } from '../../domain/repositories/B2BRepository';
import {
  CompanyNotFoundError, CompanyAlreadyExistsError, CompanyStatusError, CreditLimitExceededError,
} from '../../domain/errors/B2BErrors';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

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

  async updateProfile(
    companyId: string,
    updates: {
      name?: string;
      legalName?: string;
      taxId?: string;
      billingAddress?: Company['billingAddress'];
      shippingAddress?: Company['shippingAddress'];
      contactEmail?: string;
      contactPhone?: string;
      website?: string;
    },
  ): Promise<Company> {
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

