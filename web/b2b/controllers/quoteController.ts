/**
import { b2bRespond } from '../../respond';
 * B2B Quote Controller
 * Manages quotes with company isolation
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { b2bRespond } from 'web/respond';

interface B2BUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * GET: List company's quotes
 */
export const listQuotes = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { status, page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    let whereClause = 'WHERE q."b2bCompanyId" = $1';
    const params: any[] = [user.companyId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND q."status" = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "b2bQuote" q ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    params.push(limit, offset);
    const quotes = await query<any[]>(
      `SELECT q.*, u."name" as "createdByName"
       FROM "b2bQuote" q
       LEFT JOIN "b2bUser" u ON q."createdBy" = u."b2bUserId"
       ${whereClause}
       ORDER BY q."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    b2bRespond(req, res, 'quotes/index', {
      pageName: 'Quotes',
      user,
      quotes: quotes || [],
      pagination: {
        total,
        page: currentPage,
        pages,
        hasNext: currentPage < pages,
        hasPrev: currentPage > 1,
      },
      filters: { status },
    });
  } catch (error) {
    console.error('B2B quotes error:', error);
    b2bRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load quotes',
      user: req.user,
    });
  }
};

/**
 * GET: View single quote
 */
export const viewQuote = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { quoteId } = req.params;

    const quote = await queryOne<any>(
      `SELECT q.*, u."name" as "createdByName"
       FROM "b2bQuote" q
       LEFT JOIN "b2bUser" u ON q."createdBy" = u."b2bUserId"
       WHERE q."quoteId" = $1 AND q."b2bCompanyId" = $2`,
      [quoteId, user.companyId]
    );

    if (!quote) {
      return b2bRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Quote not found',
        user,
      });
    }

    const items = await query<any[]>(
      `SELECT qi.*, p."name" as "productName", p."sku"
       FROM "b2bQuoteItem" qi
       JOIN "product" p ON qi."productId" = p."productId"
       WHERE qi."quoteId" = $1`,
      [quoteId]
    );

    b2bRespond(req, res, 'quotes/view', {
      pageName: `Quote ${quote.quoteNumber || quoteId}`,
      user,
      quote,
      items: items || [],
    });
  } catch (error) {
    console.error('B2B view quote error:', error);
    b2bRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load quote',
      user: req.user,
    });
  }
};

/**
 * GET: Request new quote form
 */
export const createQuoteForm = async (req: Request, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    b2bRespond(req, res, 'quotes/create', {
      pageName: 'Request Quote',
      user,
    });
  } catch (error) {
    console.error('B2B create quote form error:', error);
    b2bRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load form',
      user: req.user,
    });
  }
};
