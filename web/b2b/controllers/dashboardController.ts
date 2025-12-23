/**
 * B2B Dashboard Controller
 * Shows company-specific dashboard with isolated data
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';

interface B2BUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Get company dashboard stats
 */
async function getCompanyStats(companyId: string) {
  // Company orders
  const ordersResult = await queryOne<{ count: string; total: string }>(
    `SELECT COUNT(*) as count, COALESCE(SUM("totalAmount"), 0) as total
     FROM "order"
     WHERE "b2bCompanyId" = $1 AND "deletedAt" IS NULL`,
    [companyId]
  );

  // Pending approvals (for approvers)
  const pendingApprovals = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM "b2bApprovalRequest"
     WHERE "b2bCompanyId" = $1 AND "status" = 'pending'`,
    [companyId]
  );

  // Active quotes
  const quotesResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM "b2bQuote"
     WHERE "b2bCompanyId" = $1 AND "status" IN ('draft', 'sent', 'negotiating')`,
    [companyId]
  );

  return {
    totalOrders: parseInt(ordersResult?.count || '0'),
    totalSpent: parseFloat(ordersResult?.total || '0'),
    pendingApprovals: parseInt(pendingApprovals?.count || '0'),
    activeQuotes: parseInt(quotesResult?.count || '0'),
  };
}

/**
 * Get recent company orders
 */
async function getCompanyRecentOrders(companyId: string, limit: number = 5) {
  const orders = await query<any[]>(
    `SELECT "orderId", "orderNumber", "totalAmount", "status", "createdAt"
     FROM "order"
     WHERE "b2bCompanyId" = $1 AND "deletedAt" IS NULL
     ORDER BY "createdAt" DESC
     LIMIT $2`,
    [companyId, limit]
  );
  return orders || [];
}

/**
 * Get pending approvals for user
 */
async function getPendingApprovals(companyId: string, userId: string, role: string, limit: number = 5) {
  // Only approvers and admins see approvals
  if (role !== 'approver' && role !== 'admin') {
    return [];
  }

  const approvals = await query<any[]>(
    `SELECT ar.*, u."name" as "requestedByName"
     FROM "b2bApprovalRequest" ar
     JOIN "b2bUser" u ON ar."requestedBy" = u."b2bUserId"
     WHERE ar."b2bCompanyId" = $1 AND ar."status" = 'pending'
     ORDER BY ar."createdAt" DESC
     LIMIT $2`,
    [companyId, limit]
  );
  return approvals || [];
}

/**
 * GET: B2B dashboard
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const [stats, recentOrders, pendingApprovals] = await Promise.all([
      getCompanyStats(user.companyId),
      getCompanyRecentOrders(user.companyId, 5),
      getPendingApprovals(user.companyId, user.id, user.role, 5),
    ]);

    res.render('b2b/views/dashboard', {
      pageName: 'Dashboard',
      user,
      stats,
      recentOrders,
      pendingApprovals,
    });
  } catch (error) {
    console.error('B2B dashboard error:', error);
    res.status(500).render('b2b/views/error', {
      pageName: 'Error',
      error: 'Failed to load dashboard',
      user: req.user,
    });
  }
};
