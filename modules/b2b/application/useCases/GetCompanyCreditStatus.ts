/**
 * Get Company Credit Status Use Case
 * Returns credit limit, current balance, and available credit for a company
 */

import * as b2bCompanyCreditLimitRepo from '../../infrastructure/repositories/b2bCompanyCreditLimitRepo';
import * as b2bCompanyCreditTransactionRepo from '../../infrastructure/repositories/b2bCompanyCreditTransactionRepo';

export interface GetCompanyCreditStatusCommand {
  b2bCompanyId: string;
}

export interface GetCompanyCreditStatusResponse {
  success: boolean;
  creditStatus?: {
    b2bCompanyId: string;
    creditLimit: number | null;
    currency: string;
    currentBalance: number;
    availableCredit: number | null;
    hasLimit: boolean;
  };
  error?: string;
}

export class GetCompanyCreditStatusUseCase {
  async execute(command: GetCompanyCreditStatusCommand): Promise<GetCompanyCreditStatusResponse> {
    try {
      if (!command.b2bCompanyId) {
        return { success: false, error: 'Company ID is required' };
      }

      const [creditLimit, currentBalance] = await Promise.all([
        b2bCompanyCreditLimitRepo.findByCompany(command.b2bCompanyId),
        b2bCompanyCreditTransactionRepo.getBalance(command.b2bCompanyId),
      ]);

      const limit = creditLimit?.creditLimit ?? null;
      const availableCredit = limit !== null ? limit - currentBalance : null;

      return {
        success: true,
        creditStatus: {
          b2bCompanyId: command.b2bCompanyId,
          creditLimit: limit,
          currency: creditLimit?.currency ?? 'USD',
          currentBalance,
          availableCredit,
          hasLimit: creditLimit !== null,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
