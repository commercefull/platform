/**
 * B2B Credit Controller
 * Handles credit dashboard and transaction history
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { b2bRespond } from '../../respond';
import { GetCompanyCreditStatusUseCase } from '../../../modules/b2b/application/useCases/GetCompanyCreditStatus';
import * as b2bCompanyCreditTransactionRepo from '../../../modules/b2b/infrastructure/repositories/b2bCompanyCreditTransactionRepo';

interface B2BUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * GET /b2b/credit
 * Credit dashboard showing limit, balance, and available credit
 */
export const getCreditDashboard = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const useCase = new GetCompanyCreditStatusUseCase();
    const result = await useCase.execute({ b2bCompanyId: user.companyId });

    const recentTransactions = await b2bCompanyCreditTransactionRepo.findByCompany(user.companyId);

    b2bRespond(req, res, 'credit/index', {
      pageName: 'Credit Account',
      user,
      creditStatus: result.creditStatus ?? null,
      recentTransactions: recentTransactions.slice(0, 5),
    });
  } catch (error) {
    logger.error('Error loading credit dashboard:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load credit dashboard', user: req.user });
  }
};

/**
 * GET /b2b/credit/transactions
 * Full transaction history
 */
export const getCreditTransactions = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const transactions = await b2bCompanyCreditTransactionRepo.findByCompany(user.companyId);

    b2bRespond(req, res, 'credit/transactions', {
      pageName: 'Credit Transactions',
      user,
      transactions,
    });
  } catch (error) {
    logger.error('Error loading credit transactions:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load transactions', user: req.user });
  }
};
