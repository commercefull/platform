/**
 * B2B Approval Controller
 * Manages approval workflows with company isolation
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
 * GET: List pending approvals
 */
export const listPendingApprovals = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    // Only approvers and admins can see approvals
    if (user.role !== 'approver' && user.role !== 'admin') {
      return res.status(403).render('b2b/views/error', {
        pageName: 'Access Denied',
        error: 'You do not have permission to view approvals',
        user,
      });
    }

    const { page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "b2bApprovalRequest" 
       WHERE "b2bCompanyId" = $1 AND "status" = 'pending'`,
      [user.companyId]
    );
    const total = parseInt(countResult?.count || '0');

    const approvals = await query<any[]>(
      `SELECT ar.*, u."name" as "requestedByName"
       FROM "b2bApprovalRequest" ar
       JOIN "b2bUser" u ON ar."requestedBy" = u."b2bUserId"
       WHERE ar."b2bCompanyId" = $1 AND ar."status" = 'pending'
       ORDER BY ar."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [user.companyId, limit, offset]
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    res.render('b2b/views/approvals/pending', {
      pageName: 'Pending Approvals',
      user,
      approvals: approvals || [],
      pagination: {
        total,
        page: currentPage,
        pages,
        hasNext: currentPage < pages,
        hasPrev: currentPage > 1,
      },
    });
  } catch (error) {
    console.error('B2B pending approvals error:', error);
    res.status(500).render('b2b/views/error', {
      pageName: 'Error',
      error: 'Failed to load approvals',
      user: req.user,
    });
  }
};

/**
 * GET: Approval history
 */
export const listApprovalHistory = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "b2bApprovalRequest" 
       WHERE "b2bCompanyId" = $1 AND "status" != 'pending'`,
      [user.companyId]
    );
    const total = parseInt(countResult?.count || '0');

    const approvals = await query<any[]>(
      `SELECT ar.*, 
              u1."name" as "requestedByName",
              u2."name" as "processedByName"
       FROM "b2bApprovalRequest" ar
       JOIN "b2bUser" u1 ON ar."requestedBy" = u1."b2bUserId"
       LEFT JOIN "b2bUser" u2 ON ar."processedBy" = u2."b2bUserId"
       WHERE ar."b2bCompanyId" = $1 AND ar."status" != 'pending'
       ORDER BY ar."processedAt" DESC
       LIMIT $2 OFFSET $3`,
      [user.companyId, limit, offset]
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    res.render('b2b/views/approvals/history', {
      pageName: 'Approval History',
      user,
      approvals: approvals || [],
      pagination: {
        total,
        page: currentPage,
        pages,
        hasNext: currentPage < pages,
        hasPrev: currentPage > 1,
      },
    });
  } catch (error) {
    console.error('B2B approval history error:', error);
    res.status(500).render('b2b/views/error', {
      pageName: 'Error',
      error: 'Failed to load approval history',
      user: req.user,
    });
  }
};

/**
 * GET: View approval request
 */
export const viewApproval = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { approvalId } = req.params;

    const approval = await queryOne<any>(
      `SELECT ar.*, u."name" as "requestedByName"
       FROM "b2bApprovalRequest" ar
       JOIN "b2bUser" u ON ar."requestedBy" = u."b2bUserId"
       WHERE ar."approvalRequestId" = $1 AND ar."b2bCompanyId" = $2`,
      [approvalId, user.companyId]
    );

    if (!approval) {
      return res.status(404).render('b2b/views/error', {
        pageName: 'Not Found',
        error: 'Approval request not found',
        user,
      });
    }

    res.render('b2b/views/approvals/view', {
      pageName: 'Approval Request',
      user,
      approval,
      canApprove: (user.role === 'approver' || user.role === 'admin') && approval.status === 'pending',
    });
  } catch (error) {
    console.error('B2B view approval error:', error);
    res.status(500).render('b2b/views/error', {
      pageName: 'Error',
      error: 'Failed to load approval',
      user: req.user,
    });
  }
};
