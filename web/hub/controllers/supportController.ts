/**
 * Support Controller for Admin Hub
 * Handles support tickets and FAQ management
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Support Dashboard
// ============================================================================

export const supportDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get support stats
    const statsResult = await queryOne<any>(
      `SELECT
        COUNT(CASE WHEN "status" IN ('open', 'pending') THEN 1 END) as "openTickets",
        COUNT(CASE WHEN "status" = 'resolved' AND DATE("updatedAt") = CURRENT_DATE THEN 1 END) as "resolvedToday"
       FROM "supportTicket"`
    );

    // Get average response time (in hours)
    const responseTimeResult = await queryOne<any>(
      `SELECT AVG(EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")) / 3600) as "avgResponseTime"
       FROM "supportTicket"
       WHERE "firstResponseAt" IS NOT NULL`
    );

    // Get customer satisfaction (mock data for now)
    const satisfactionResult = { customerSatisfaction: 85 };

    // Get recent tickets
    const tickets = await query<Array<any>>(
      `SELECT st.*, c."email" as "customerEmail",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "supportTicket" st
       LEFT JOIN "customer" c ON st."customerId" = c."customerId"
       WHERE st."deletedAt" IS NULL
       ORDER BY st."createdAt" DESC
       LIMIT 20`
    );

    // Get FAQs
    const faqs = await query<Array<any>>(
      `SELECT * FROM "faq"
       WHERE "deletedAt" IS NULL AND "isPublished" = true
       ORDER BY "category", "sortOrder"`
    );

    res.render('hub/views/support/index', {
      pageName: 'Support Center',
      stats: {
        openTickets: parseInt(statsResult?.openTickets || '0'),
        resolvedToday: parseInt(statsResult?.resolvedToday || '0'),
        avgResponseTime: Math.round(parseFloat(responseTimeResult?.avgResponseTime || '0')),
        customerSatisfaction: satisfactionResult.customerSatisfaction
      },
      tickets: tickets || [],
      faqs: faqs || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading support dashboard:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load support dashboard',
      user: req.user
    });
  }
};

// ============================================================================
// Support Tickets
// ============================================================================

export const listSupportTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority, search, limit, offset } = req.query;

    let whereClause = 'st."deletedAt" IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND st."status" = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      whereClause += ` AND st."priority" = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (st."subject" ILIKE $${paramIndex} OR st."description" ILIKE $${paramIndex} OR c."email" ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const tickets = await query<Array<any>>(
      `SELECT st.*, c."email" as "customerEmail",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "supportTicket" st
       LEFT JOIN "customer" c ON st."customerId" = c."customerId"
       WHERE ${whereClause}
       ORDER BY st."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string) || 50, parseInt(offset as string) || 0]
    );

    res.render('hub/views/support/tickets', {
      pageName: 'Support Tickets',
      tickets: tickets || [],
      filters: { status, priority, search },
      pagination: { limit: parseInt(limit as string) || 50, offset: parseInt(offset as string) || 0 },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error listing support tickets:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load support tickets',
      user: req.user
    });
  }
};

export const viewSupportTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const ticket = await queryOne<any>(
      `SELECT st.*, c."email" as "customerEmail",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "supportTicket" st
       LEFT JOIN "customer" c ON st."customerId" = c."customerId"
       WHERE st."ticketId" = $1 AND st."deletedAt" IS NULL`,
      [ticketId]
    );

    if (!ticket) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Support ticket not found',
        user: req.user
      });
      return;
    }

    // Get ticket messages
    const messages = await query<Array<any>>(
      `SELECT stm.*, 'admin' as "senderType"
       FROM "supportTicketMessage" stm
       WHERE stm."ticketId" = $1
       ORDER BY stm."createdAt" ASC`,
      [ticketId]
    );

    res.render('hub/views/support/view-ticket', {
      pageName: `Ticket: ${ticket.ticketNumber}`,
      ticket,
      messages: messages || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error viewing support ticket:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load support ticket',
      user: req.user
    });
  }
};

export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { status, response } = req.body;

    // Update ticket status
    await query(
      `UPDATE "supportTicket" SET "status" = $1, "updatedAt" = NOW() WHERE "ticketId" = $2`,
      [status, ticketId]
    );

    // Add response message if provided
    if (response) {
      await query(
        `INSERT INTO "supportTicketMessage" ("messageId", "ticketId", "message", "senderId", "senderType", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), ticketId, response, (req as any).user?.id, 'admin']
      );

      // Update first response time if not set
      await query(
        `UPDATE "supportTicket" SET "firstResponseAt" = COALESCE("firstResponseAt", NOW())
         WHERE "ticketId" = $1`,
        [ticketId]
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// FAQ Management
// ============================================================================

export const listFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await query<Array<any>>(
      `SELECT * FROM "faq"
       WHERE "deletedAt" IS NULL
       ORDER BY "category", "sortOrder"`
    );

    res.render('hub/views/support/faqs', {
      pageName: 'FAQ Management',
      faqs: faqs || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error listing FAQs:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load FAQs',
      user: req.user
    });
  }
};

export const createFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, category, sortOrder, isPublished } = req.body;

    await query(
      `INSERT INTO "faq" ("faqId", "question", "answer", "category", "sortOrder", "isPublished", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [uuidv4(), question, answer, category || 'general', parseInt(sortOrder) || 0, isPublished === 'true']
    );

    res.redirect('/hub/support?success=FAQ created');
  } catch (error: any) {
    console.error('Error creating FAQ:', error);
    res.redirect('/hub/support?error=' + encodeURIComponent(error.message));
  }
};

export const updateFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faqId } = req.params;
    const { question, answer, category, sortOrder, isPublished } = req.body;

    await query(
      `UPDATE "faq" SET "question" = $1, "answer" = $2, "category" = $3, "sortOrder" = $4, "isPublished" = $5, "updatedAt" = NOW()
       WHERE "faqId" = $6`,
      [question, answer, category, parseInt(sortOrder) || 0, isPublished === 'true', faqId]
    );

    res.redirect('/hub/support?success=FAQ updated');
  } catch (error: any) {
    console.error('Error updating FAQ:', error);
    res.redirect('/hub/support?error=' + encodeURIComponent(error.message));
  }
};

export const deleteFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faqId } = req.params;
    await query(`UPDATE "faq" SET "deletedAt" = NOW() WHERE "faqId" = $1`, [faqId]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
