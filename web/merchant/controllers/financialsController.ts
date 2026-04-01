/**
 * Merchant Financials Controller
 * Payment balance, reports, payouts, invoices, and settlements for the merchant portal
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { merchantRespond } from '../../respond';
import { logger } from '../../../libs/logger';
import paymentBalanceRepo from '../../../modules/payment/infrastructure/repositories/paymentBalanceRepo';
import paymentReportRepo from '../../../modules/payment/infrastructure/repositories/paymentReportRepo';
import merchantBalanceRepo from '../../../modules/merchant/infrastructure/repositories/merchantBalanceRepo';
import merchantTransactionRepo from '../../../modules/merchant/infrastructure/repositories/merchantTransactionRepo';
import merchantPayoutRepo from '../../../modules/merchant/infrastructure/repositories/merchantPayoutRepo';
import merchantPayoutItemRepo from '../../../modules/merchant/infrastructure/repositories/merchantPayoutItemRepo';
import merchantInvoiceRepo from '../../../modules/merchant/infrastructure/repositories/merchantInvoiceRepo';

/**
 * GET /merchant/financials/balance
 * Shows the merchant's payment balance across all currencies
 */
export const getPaymentBalance = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const balances = await paymentBalanceRepo.findByMerchant(merchantId);

    merchantRespond(req, res, 'financials/balance', {
      pageName: 'Payment Balance',
      balances,
    });
  } catch (error) {
    logger.error('Error loading payment balance:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load payment balance' });
  }
};

/**
 * GET /merchant/financials/reports
 * Lists payment reports for the merchant
 */
export const listPaymentReports = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const reports = await paymentReportRepo.findByMerchant(merchantId);

    merchantRespond(req, res, 'financials/reports', {
      pageName: 'Payment Reports',
      reports,
    });
  } catch (error) {
    logger.error('Error loading payment reports:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load payment reports' });
  }
};

/**
 * GET /merchant/financials
 * Financials dashboard — balance summary, recent payouts, recent invoices
 */
export const getFinancialsDashboard = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const [balance, recentPayouts, recentInvoices] = await Promise.all([
      merchantBalanceRepo.findByMerchant(merchantId),
      merchantPayoutRepo.findByMerchant(merchantId, 5, 0),
      merchantInvoiceRepo.findByMerchant(merchantId, 5, 0),
    ]);

    merchantRespond(req, res, 'financials/index', {
      pageName: 'Financials',
      balance,
      recentPayouts,
      recentInvoices,
    });
  } catch (error) {
    logger.error('Error loading financials dashboard:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load financials dashboard' });
  }
};

/**
 * GET /merchant/financials/payouts
 * Lists all payouts for the merchant
 */
export const listPayouts = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const limit = parseInt(req.query?.limit as string) || 20;
    const offset = parseInt(req.query?.offset as string) || 0;

    const payouts = await merchantPayoutRepo.findByMerchant(merchantId, limit, offset);

    merchantRespond(req, res, 'financials/payouts', {
      pageName: 'Payouts',
      payouts,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error loading payouts:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load payouts' });
  }
};

/**
 * GET /merchant/financials/payouts/:payoutId
 * Payout detail with line items
 */
export const viewPayout = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const { payoutId } = req.params as { payoutId: string };
    const [payout, lineItems] = await Promise.all([
      merchantPayoutRepo.findById(payoutId),
      merchantPayoutItemRepo.findByPayout(payoutId),
    ]);

    if (!payout || payout.merchantId !== merchantId) {
      return res.redirect('/merchant/financials/payouts');
    }

    merchantRespond(req, res, 'financials/payout-detail', {
      pageName: 'Payout Detail',
      payout,
      lineItems,
    });
  } catch (error) {
    logger.error('Error loading payout detail:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load payout detail' });
  }
};

/**
 * GET /merchant/financials/invoices
 * Lists invoices for the merchant
 */
export const listInvoices = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const limit = parseInt(req.query?.limit as string) || 20;
    const offset = parseInt(req.query?.offset as string) || 0;

    const invoices = await merchantInvoiceRepo.findByMerchant(merchantId, limit, offset);

    merchantRespond(req, res, 'financials/invoices', {
      pageName: 'Invoices',
      invoices,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error loading invoices:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load invoices' });
  }
};

/**
 * GET /merchant/financials/settlements
 * Lists settlements (payouts) for the merchant
 */
export const listSettlements = async (req: TypedRequest, res: Response) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.redirect('/merchant/login');

    const limit = parseInt(req.query?.limit as string) || 20;
    const offset = parseInt(req.query?.offset as string) || 0;

    const settlements = await merchantPayoutRepo.findByMerchant(merchantId, limit, offset);

    merchantRespond(req, res, 'financials/settlements', {
      pageName: 'Settlements',
      settlements,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error loading settlements:', error);
    merchantRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load settlements' });
  }
};
