/**
 * Record Credit Transaction Use Case
 * Creates a credit transaction, rejects if balance would exceed limit
 */

import * as b2bCompanyCreditTransactionRepo from '../../infrastructure/repositories/b2bCompanyCreditTransactionRepo';
import * as b2bCompanyCreditLimitRepo from '../../infrastructure/repositories/b2bCompanyCreditLimitRepo';

export interface RecordCreditTransactionCommand {
  b2bCompanyId: string;
  amount: number;
  type: string;
  referenceId?: string;
  notes?: string;
}

export interface RecordCreditTransactionResponse {
  success: boolean;
  transaction?: {
    b2bCompanyCreditTransactionId: string;
    b2bCompanyId: string;
    amount: number;
    type: string;
    newBalance: number;
    createdAt: Date;
  };
  error?: string;
}

export class RecordCreditTransactionUseCase {
  async execute(command: RecordCreditTransactionCommand): Promise<RecordCreditTransactionResponse> {
    try {
      if (!command.b2bCompanyId) {
        return { success: false, error: 'Company ID is required' };
      }
      if (command.amount === undefined || command.amount === null) {
        return { success: false, error: 'Amount is required' };
      }
      if (!command.type) {
        return { success: false, error: 'Transaction type is required' };
      }

      const currentBalance = await b2bCompanyCreditTransactionRepo.getBalance(command.b2bCompanyId);
      const projectedBalance = currentBalance + command.amount;

      // If this is a debit (positive amount used against credit), check limit
      if (command.amount > 0) {
        const creditLimit = await b2bCompanyCreditLimitRepo.findByCompany(command.b2bCompanyId);
        if (creditLimit && projectedBalance > creditLimit.creditLimit) {
          return {
            success: false,
            error: `Transaction would exceed credit limit. Limit: ${creditLimit.creditLimit}, Current balance: ${currentBalance}, Requested: ${command.amount}`,
          };
        }
      }

      const transaction = await b2bCompanyCreditTransactionRepo.create({
        b2bCompanyId: command.b2bCompanyId,
        amount: command.amount,
        type: command.type,
        referenceId: command.referenceId,
        notes: command.notes,
      });

      return {
        success: true,
        transaction: {
          b2bCompanyCreditTransactionId: transaction.b2bCompanyCreditTransactionId,
          b2bCompanyId: transaction.b2bCompanyId,
          amount: transaction.amount,
          type: transaction.type,
          newBalance: projectedBalance,
          createdAt: transaction.createdAt,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
