/**
 * Create Company Use Case
 * Creates a new B2B company account
 */

import * as companyRepo from '../../../repos/companyRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export interface CreateCompanyCommand {
  name: string;
  taxId?: string;
  vatNumber?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  billingAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  shippingAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  creditLimit?: number;
  paymentTermsDays?: number;
  notes?: string;
  createdBy?: string;
}

export interface CreateCompanyResponse {
  success: boolean;
  company?: {
    id: string;
    name: string;
    taxId?: string;
    status: string;
    creditLimit?: number;
    paymentTermsDays?: number;
    createdAt: Date;
  };
  error?: string;
}

export class CreateCompanyUseCase {
  async execute(command: CreateCompanyCommand): Promise<CreateCompanyResponse> {
    try {
      // Validate required fields
      if (!command.name || command.name.trim().length === 0) {
        return { success: false, error: 'Company name is required' };
      }

      // Check for duplicate VAT number if provided
      if (command.vatNumber) {
        const existingCompany = await companyRepo.getCompanyByVat(command.vatNumber);
        if (existingCompany) {
          return { success: false, error: 'A company with this VAT number already exists' };
        }
      }

      // Create the company
      const company = await companyRepo.saveCompany({
        name: command.name.trim(),
        taxId: command.taxId,
        vatNumber: command.vatNumber,
        industry: command.industry,
        website: command.website,
        phone: command.phone,
        email: command.email,
        creditLimit: command.creditLimit || 0,
        availableCredit: command.creditLimit || 0,
        usedCredit: 0,
        paymentTermsDays: command.paymentTermsDays || 30,
        paymentTermsType: 'net',
        status: 'pending',
        companyType: 'corporation',
        currency: 'USD',
        notes: command.notes,
      });

      // Create addresses if provided
      if (command.billingAddress) {
        await companyRepo.saveCompanyAddress({
          b2bCompanyId: company.b2bCompanyId,
          addressType: 'billing',
          addressLine1: command.billingAddress.addressLine1,
          addressLine2: command.billingAddress.addressLine2,
          city: command.billingAddress.city,
          state: command.billingAddress.state,
          postalCode: command.billingAddress.postalCode,
          countryCode: command.billingAddress.country,
          isDefault: true,
        });
      }

      if (command.shippingAddress) {
        await companyRepo.saveCompanyAddress({
          b2bCompanyId: company.b2bCompanyId,
          addressType: 'shipping',
          addressLine1: command.shippingAddress.addressLine1,
          addressLine2: command.shippingAddress.addressLine2,
          city: command.shippingAddress.city,
          state: command.shippingAddress.state,
          postalCode: command.shippingAddress.postalCode,
          countryCode: command.shippingAddress.country,
          isDefault: true,
        });
      }

      // Emit event (cast to any to bypass type check until events are registered)
      (eventBus as any).emit('b2b.company.created', {
        companyId: company.b2bCompanyId,
        name: company.name,
        taxId: company.taxId,
        industry: company.industry,
        status: company.status,
        createdBy: command.createdBy,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        company: {
          id: company.b2bCompanyId,
          name: company.name,
          taxId: company.taxId,
          status: company.status,
          creditLimit: company.creditLimit,
          paymentTermsDays: company.paymentTermsDays,
          createdAt: company.createdAt,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
