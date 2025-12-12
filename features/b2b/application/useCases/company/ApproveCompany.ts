/**
 * Approve Company Use Case
 * Approves a pending B2B company application
 */

import * as companyRepo from '../../../repos/companyRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export interface ApproveCompanyCommand {
  companyId: string;
  approvedBy: string;
  creditLimit?: number;
  paymentTermsDays?: number;
}

export interface ApproveCompanyResponse {
  success: boolean;
  company?: {
    id: string;
    name: string;
    status: string;
    creditLimit: number;
    approvedAt: Date;
  };
  error?: string;
}

export class ApproveCompanyUseCase {
  async execute(command: ApproveCompanyCommand): Promise<ApproveCompanyResponse> {
    try {
      const company = await companyRepo.getCompany(command.companyId);
      if (!company) {
        return { success: false, error: 'Company not found' };
      }

      if (company.status !== 'pending') {
        return { success: false, error: 'Only pending companies can be approved' };
      }

      // Update credit limit if provided
      if (command.creditLimit !== undefined) {
        await companyRepo.updateCompanyCredit(
          command.companyId,
          command.creditLimit,
          command.creditLimit // Available credit starts at full limit
        );
      }

      // Approve the company
      await companyRepo.approveCompany(command.companyId, command.approvedBy);

      // Get updated company
      const updatedCompany = await companyRepo.getCompany(command.companyId);

      // Emit event
      (eventBus as any).emit('b2b.company.approved', {
        companyId: company.b2bCompanyId,
        name: company.name,
        approvedBy: command.approvedBy,
        creditLimit: command.creditLimit || company.creditLimit,
        paymentTerms: `net${command.paymentTermsDays || company.paymentTermsDays}`,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        company: {
          id: updatedCompany!.b2bCompanyId,
          name: updatedCompany!.name,
          status: updatedCompany!.status,
          creditLimit: updatedCompany!.creditLimit,
          approvedAt: updatedCompany!.approvedAt || new Date()
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
