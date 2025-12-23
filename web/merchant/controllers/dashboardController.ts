/**
 * Merchant Dashboard Controller
 * Shows merchant-specific dashboard with isolated data
 */

import { Request, Response } from 'express';
import { merchantRespond } from '../../respond';
import DashboardQueryRepository from '../../../modules/analytics/infrastructure/repositories/DashboardQueryRepository';

interface MerchantUser {
  id: string;
  merchantId: string;
  email: string;
  name: string;
}

/**
 * GET: Merchant dashboard
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const user = req.user as MerchantUser;
    if (!user?.merchantId) {
      return res.redirect('/merchant/login');
    }

    const [stats, recentOrders, topProducts] = await Promise.all([
      DashboardQueryRepository.getMerchantDashboardStats(user.merchantId),
      DashboardQueryRepository.getMerchantRecentOrders(user.merchantId, 5),
      DashboardQueryRepository.getMerchantTopProducts(user.merchantId, 5),
    ]);

    merchantRespond(req, res, 'dashboard', {
      pageName: 'Dashboard',
      stats,
      recentOrders,
      topProducts,
    });
  } catch (error) {
    console.error('Merchant dashboard error:', error);
    merchantRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load dashboard',
    });
  }
};
