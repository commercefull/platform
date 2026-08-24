/**
 * Storefront Support Controller
 * Handles support ticket views for customers
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { ManageStorefrontSupportUseCase, type TicketStatus, type TicketPriority, type TicketCategory } from '../../../modules/support/application/useCases/ManageStorefrontSupport';

const manageSupportUseCase = new ManageStorefrontSupportUseCase();

interface CustomerUser {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * GET: List customer's support tickets
 */
export const listTickets = async (req: TypedRequest, res: Response): Promise<void> => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin?redirect=/support/tickets');
  }

  const status = req.query.status as string | undefined;
  const result = await manageSupportUseCase.getTickets(
    { customerId: user.customerId, status: status as TicketStatus | undefined },
    { limit: 50, offset: 0 },
  );

  storefrontRespond(req, res, 'support/tickets', {
    pageName: 'My Support Tickets',
    tickets: result.data,
    total: result.total,
    currentStatus: status || 'all',
  });
  
};

/**
 * GET: View a single ticket with messages
 */
export const viewTicket = async (req: TypedRequest, res: Response): Promise<void> => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin?redirect=/support/tickets');
  }

  const ticket = await manageSupportUseCase.getTicket(req.params.ticketId);
  if (!ticket || ticket.customerId !== user.customerId) {
    return storefrontRespond(req, res, '404', {
      pageName: 'Ticket Not Found',
    });
  }

  const messages = await manageSupportUseCase.getMessages(req.params.ticketId, false);
  const attachments = await manageSupportUseCase.getAttachments(req.params.ticketId);

  await manageSupportUseCase.markMessagesRead(req.params.ticketId, user.customerId);

  storefrontRespond(req, res, 'support/ticket-detail', {
    pageName: `Ticket #${ticket.ticketNumber}`,
    ticket,
    messages,
    attachments,
  });
  
};

/**
 * GET: Create ticket form
 */
export const createTicketForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin?redirect=/support/tickets/new');
  }

  storefrontRespond(req, res, 'support/create-ticket', {
    pageName: 'New Support Ticket',
    formData: {},
    orderId: req.query.orderId as string | undefined,
  });
  
};

/**
 * POST: Submit a new ticket
 */
export const createTicketSubmit = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin?redirect=/support/tickets/new');
    }

    const body = req.body as RequestBody;
    const { subject, description, category, priority, orderId, email, name, phone } = body;

    if (!subject || !description) {
      return storefrontRespond(req, res, 'support/create-ticket', {
        pageName: 'New Support Ticket',
        error: 'Subject and description are required',
        formData: req.body as RequestBody,
        orderId: orderId as string | undefined,
      });
    }

    const ticket = await manageSupportUseCase.createTicket({
      customerId: user.customerId,
      orderId: orderId as string | undefined,
      email: (email as string) || user.email,
      name: (name as string) || `${user.firstName} ${user.lastName}`,
      phone: phone as string | undefined,
      subject: subject as string,
      description: description as string,
      priority: priority as TicketPriority | undefined,
      category: category as TicketCategory | undefined,
      channel: 'web',
    });

    if (description) {
      await manageSupportUseCase.addMessage({
        supportTicketId: ticket.supportTicketId,
        senderId: user.customerId,
        senderType: 'customer',
        senderName: (name as string) || `${user.firstName} ${user.lastName}`,
        senderEmail: (email as string) || user.email,
        message: description as string,
      });
    }

    res.redirect(`/support/tickets/${ticket.supportTicketId}?success=Ticket created successfully`);
  } catch (error: unknown) {
    logger.warn('Error creating ticket:', error);
    storefrontRespond(req, res, 'support/create-ticket', {
      pageName: 'New Support Ticket',
      error: (error as Error).message || 'Failed to create ticket',
      formData: req.body as RequestBody,
      orderId: (req.body as RequestBody).orderId as string | undefined,
    });
  }
};

/**
 * POST: Add a message to a ticket
 */
export const addTicketMessage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin?redirect=/support/tickets');
    }

    const ticket = await manageSupportUseCase.getTicket(req.params.ticketId);
    if (!ticket || ticket.customerId !== user.customerId) {
      return storefrontRespond(req, res, '404', {
        pageName: 'Ticket Not Found',
      });
    }

    if (ticket.status === 'closed') {
      req.flash('error', 'Cannot reply to a closed ticket');
      return res.redirect(`/support/tickets/${req.params.ticketId}`);
    }

    const body = req.body as RequestBody;
    const { message } = body;

    if (!message) {
      req.flash('error', 'Message is required');
      return res.redirect(`/support/tickets/${req.params.ticketId}`);
    }

    await manageSupportUseCase.addMessage({
      supportTicketId: req.params.ticketId,
      senderId: user.customerId,
      senderType: 'customer',
      senderName: `${user.firstName} ${user.lastName}`,
      senderEmail: user.email,
      message: message as string,
    });

    res.redirect(`/support/tickets/${req.params.ticketId}?success=Message sent`);
  } catch (error: unknown) {
    logger.warn('Error adding message:', error);
    req.flash('error', 'Failed to send message');
    res.redirect(`/support/tickets/${req.params.ticketId}`);
  }
};

/**
 * POST: Submit ticket feedback (satisfaction rating)
 */
export const submitTicketFeedback = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin?redirect=/support/tickets');
    }

    const ticket = await manageSupportUseCase.getTicket(req.params.ticketId);
    if (!ticket || ticket.customerId !== user.customerId) {
      return storefrontRespond(req, res, '404', {
        pageName: 'Ticket Not Found',
      });
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      req.flash('error', 'Feedback can only be submitted for resolved tickets');
      return res.redirect(`/support/tickets/${req.params.ticketId}`);
    }

    const body = req.body as RequestBody;
    const satisfaction = parseInt(body.satisfaction as string, 10);
    const feedback = body.feedback as string | undefined;

    if (satisfaction < 1 || satisfaction > 5) {
      req.flash('error', 'Rating must be between 1 and 5');
      return res.redirect(`/support/tickets/${req.params.ticketId}`);
    }

    await manageSupportUseCase.submitFeedback(req.params.ticketId, satisfaction, feedback);
    req.flash('success', 'Thank you for your feedback!');
    res.redirect(`/support/tickets/${req.params.ticketId}`);
  } catch (error: unknown) {
    logger.warn('Error submitting feedback:', error);
    req.flash('error', 'Failed to submit feedback');
    res.redirect(`/support/tickets/${req.params.ticketId}`);
  }
};
