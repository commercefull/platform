/**
 * Support Controller for Admin Hub
 * Handles support tickets and FAQ management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import { ManageSupportTicketsUseCase, ManageFaqUseCase } from '../../../modules/support/application/useCases/ManageSupport';

const manageSupportTicketsUseCase = new ManageSupportTicketsUseCase();
const manageFaqUseCase = new ManageFaqUseCase();

// ============================================================================
// Support Dashboard
// ============================================================================

export const supportDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  const stats = await manageSupportTicketsUseCase.getSupportStats();
  const tickets = await manageSupportTicketsUseCase.listRecentTickets(20);
  const { data: faqArticles } = await manageFaqUseCase.getArticles({ isPublished: true });

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
  
};

// ============================================================================
// Support Tickets
// ============================================================================

export const listSupportTickets = async (req: TypedRequest, res: Response): Promise<void> => {
  const { status, priority, search, limit, offset } = req.query;

  const tickets = await manageSupportTicketsUseCase.listTickets({
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
  
};

export const viewSupportTicket = async (req: TypedRequest, res: Response): Promise<void> => {
  const { ticketId } = req.params;

  const ticket = await manageSupportTicketsUseCase.findTicketById(ticketId);

  if (!ticket) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Support ticket not found',
    });
    return;
  }

  const messages = await manageSupportTicketsUseCase.listTicketMessages(ticketId);

  adminRespond(req, res, 'support/view-ticket', {
    pageName: `Ticket: ${ticket.ticketNumber}`,
    ticket,
    messages,
  });
  
};

export const updateTicketStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  const { ticketId } = req.params;
  const body = req.body as RequestBody;
  const { status, response } = body;

  await manageSupportTicketsUseCase.updateTicketStatus(ticketId, status);

  if (response) {
    await manageSupportTicketsUseCase.addTicketMessage(ticketId, response, req.user?.id || '');
  }

  res.json({ success: true });
  
};

// ============================================================================
// FAQ Management
// ============================================================================

export const listFaqs = async (req: TypedRequest, res: Response): Promise<void> => {
  const { data: faqs } = await manageFaqUseCase.getArticles(undefined, { limit: 100 });

  adminRespond(req, res, 'support/faqs', {
    pageName: 'FAQ Management',
    faqs,
  });
  
};

export const createFaq = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { question, answer, _category, sortOrder, isPublished } = body;

    await manageFaqUseCase.saveArticle({
      title: question,
      content: answer,
      isPublished: isPublished === 'true',
      sortOrder: parseInt(sortOrder) || 0,
    });

    res.redirect('/hub/support?success=FAQ created');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/hub/support?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateFaq = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { faqId } = req.params;
    const body = req.body as RequestBody;
    const { question, answer, _category, sortOrder, isPublished } = body;

    await manageFaqUseCase.saveArticle({
      faqArticleId: faqId,
      title: question,
      content: answer,
      isPublished: isPublished === 'true',
      sortOrder: parseInt(sortOrder) || 0,
    });

    res.redirect('/hub/support?success=FAQ updated');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/hub/support?error=' + encodeURIComponent((error as Error).message));
  }
};

export const deleteFaq = async (req: TypedRequest, res: Response): Promise<void> => {
  const { faqId } = req.params;
  await manageFaqUseCase.deleteArticle(faqId);
  res.json({ success: true });
  
};
