/**
 * Support Controller for Admin Hub
 * Handles support tickets and FAQ management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import * as adminSupportRepo from '../../../modules/support/infrastructure/repositories/adminSupportRepo';
import * as faqRepo from '../../../modules/support/infrastructure/repositories/faqRepo';

// ============================================================================
// Support Dashboard
// ============================================================================

export const supportDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminSupportRepo.getSupportStats();
    const tickets = await adminSupportRepo.listRecentTickets(20);
    const { data: faqArticles } = await faqRepo.getArticles({ isPublished: true });

    adminRespond(req, res, 'support/index', {
      pageName: 'Support Center',
      stats: {
        openTickets: stats.openTickets,
        resolvedToday: stats.resolvedToday,
        avgResponseTime: stats.avgResponseTime,
        customerSatisfaction: 85,
      },
      tickets,
      faqs: faqArticles,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load support dashboard',
    });
  }
};

// ============================================================================
// Support Tickets
// ============================================================================

export const listSupportTickets = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, search, limit, offset } = req.query;

    const tickets = await adminSupportRepo.listTickets({
      status: status as string | undefined,
      priority: priority as string | undefined,
      search: search as string | undefined,
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
    });

    adminRespond(req, res, 'support/tickets', {
      pageName: 'Support Tickets',
      tickets,
      filters: { status, priority, search },
      pagination: { limit: parseInt(limit as string) || 50, offset: parseInt(offset as string) || 0 },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load support tickets',
    });
  }
};

export const viewSupportTicket = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const ticket = await adminSupportRepo.findTicketById(ticketId);

    if (!ticket) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Support ticket not found',
      });
      return;
    }

    const messages = await adminSupportRepo.listTicketMessages(ticketId);

    adminRespond(req, res, 'support/view-ticket', {
      pageName: `Ticket: ${ticket.ticketNumber}`,
      ticket,
      messages,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load support ticket',
    });
  }
};

export const updateTicketStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const body = req.body as RequestBody;
    const { status, response } = body;

    await adminSupportRepo.updateTicketStatus(ticketId, status);

    if (response) {
      await adminSupportRepo.addTicketMessage(ticketId, response, req.user?.id || '');
    }

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// FAQ Management
// ============================================================================

export const listFaqs = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { data: faqs } = await faqRepo.getArticles(undefined, { limit: 100 });

    adminRespond(req, res, 'support/faqs', {
      pageName: 'FAQ Management',
      faqs,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load FAQs',
    });
  }
};

export const createFaq = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { question, answer, _category, sortOrder, isPublished } = body;

    await faqRepo.saveArticle({
      title: question,
      content: answer,
      isPublished: isPublished === 'true',
      sortOrder: parseInt(sortOrder) || 0,
    });

    res.redirect('/hub/support?success=FAQ created');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.redirect('/hub/support?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateFaq = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { faqId } = req.params;
    const body = req.body as RequestBody;
    const { question, answer, _category, sortOrder, isPublished } = body;

    await faqRepo.saveArticle({
      faqArticleId: faqId,
      title: question,
      content: answer,
      isPublished: isPublished === 'true',
      sortOrder: parseInt(sortOrder) || 0,
    });

    res.redirect('/hub/support?success=FAQ updated');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.redirect('/hub/support?error=' + encodeURIComponent((error as Error).message));
  }
};

export const deleteFaq = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { faqId } = req.params;
    await faqRepo.deleteArticle(faqId);
    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
