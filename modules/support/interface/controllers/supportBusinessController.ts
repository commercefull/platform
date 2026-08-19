/**
 * Support Business Controller
 * Handles admin/merchant support operations
 */

import { logger } from '../../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as supportRepo from '../../infrastructure/repositories/supportRepo';
import * as faqRepo from '../../infrastructure/repositories/faqRepo';
import * as alertRepo from '../../infrastructure/repositories/alertRepo';
import type { AlertStatus } from '../../infrastructure/repositories/alertRepo';
import type { TicketStatus, TicketPriority, TicketCategory } from '../../infrastructure/repositories/supportRepo';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

// ============================================================================
// Support Agents
// ============================================================================

export const getAgents: AsyncHandler = async (req, res, _next) => {
  try {
    const { isActive, isAvailable, department } = req.query;
    const agents = await supportRepo.getAgents({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      department: department as string,
    });
    res.json({ success: true, data: agents });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getAgent: AsyncHandler = async (req, res, _next) => {
  try {
    const agent = await supportRepo.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ success: false, message: 'Agent not found' });
      return;
    }
    res.json({ success: true, data: agent });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createAgent: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<supportRepo.SupportAgent> & { email: string; firstName: string; lastName: string };
    const agent = await supportRepo.saveAgent(body);
    res.status(201).json({ success: true, data: agent });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateAgent: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<supportRepo.SupportAgent>;
    const agent = await supportRepo.saveAgent({
      supportAgentId: req.params.id,
      ...body,
    } as Partial<supportRepo.SupportAgent> & { email: string; firstName: string; lastName: string });
    res.json({ success: true, data: agent });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Support Tickets (Admin)
// ============================================================================

export const getTickets: AsyncHandler = async (req, res, _next) => {
  try {
    const { customerId, assignedAgentId, status, priority, category, isEscalated, limit, offset } = req.query;
    const result = await supportRepo.getTickets(
      {
        customerId: customerId as string,
        assignedAgentId: assignedAgentId as string,
        status: status as TicketStatus | undefined,
        priority: priority as TicketPriority | undefined,
        category: category as TicketCategory | undefined,
        isEscalated: isEscalated === 'true' ? true : isEscalated === 'false' ? false : undefined,
      },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getTicket: AsyncHandler = async (req, res, _next) => {
  try {
    const ticket = await supportRepo.getTicket(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const messages = await supportRepo.getMessages(req.params.id, true);
    const attachments = await supportRepo.getAttachments(req.params.id);

    res.json({ success: true, data: { ...ticket, messages, attachments } });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateTicket: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<supportRepo.SupportTicket>;
    const ticket = await supportRepo.updateTicket(req.params.id, body);
    res.json({ success: true, data: ticket });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const assignTicket: AsyncHandler = async (req, res, _next) => {
  try {
    const { agentId } = req.body as { agentId: string };
    const ticket = await supportRepo.updateTicket(req.params.id, { assignedAgentId: agentId });
    res.json({ success: true, data: ticket });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const resolveTicket: AsyncHandler = async (req, res, _next) => {
  try {
    const { resolutionType, resolutionNotes } = req.body as { resolutionType: string; resolutionNotes?: string };
    await supportRepo.resolveTicket(req.params.id, resolutionType, resolutionNotes);
    res.json({ success: true, message: 'Ticket resolved' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const closeTicket: AsyncHandler = async (req, res, _next) => {
  try {
    await supportRepo.closeTicket(req.params.id);
    res.json({ success: true, message: 'Ticket closed' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const escalateTicket: AsyncHandler = async (req, res, _next) => {
  try {
    const { escalatedTo, reason } = req.body as { escalatedTo: string; reason: string };
    await supportRepo.escalateTicket(req.params.id, escalatedTo, reason);
    res.json({ success: true, message: 'Ticket escalated' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const addAgentMessage: AsyncHandler = async (req, res, _next) => {
  try {
    const agentId = req.user?.userId || req.user?.organizationId || '';
    const agent = await supportRepo.getAgent(agentId);

    const body = req.body as { message: string; messageHtml?: string; isInternal?: boolean };
    const message = await supportRepo.addMessage({
      supportTicketId: req.params.id,
      senderId: agentId,
      senderType: 'agent',
      senderName: agent ? `${agent.firstName} ${agent.lastName}` : undefined,
      senderEmail: agent?.email,
      message: body.message,
      messageHtml: body.messageHtml,
      isInternal: body.isInternal || false,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// FAQ Categories (Admin)
// ============================================================================

export const getFaqCategories: AsyncHandler = async (req, res, _next) => {
  try {
    const { activeOnly } = req.query;
    const categories = await faqRepo.getCategories(activeOnly !== 'false');
    res.json({ success: true, data: categories });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getFaqCategory: AsyncHandler = async (req, res, _next) => {
  try {
    const category = await faqRepo.getCategory(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createFaqCategory: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<faqRepo.FaqCategory> & { name: string };
    const category = await faqRepo.saveCategory(body);
    res.status(201).json({ success: true, data: category });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateFaqCategory: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<faqRepo.FaqCategory>;
    const category = await faqRepo.saveCategory({
      faqCategoryId: req.params.id,
      ...body,
    } as Partial<faqRepo.FaqCategory> & { name: string });
    res.json({ success: true, data: category });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteFaqCategory: AsyncHandler = async (req, res, _next) => {
  try {
    await faqRepo.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// FAQ Articles (Admin)
// ============================================================================

export const getFaqArticles: AsyncHandler = async (req, res, _next) => {
  try {
    const { faqCategoryId, isPublished, isFeatured, limit, offset } = req.query;
    const result = await faqRepo.getArticles(
      {
        faqCategoryId: faqCategoryId as string,
        isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
        isFeatured: isFeatured === 'true' ? true : undefined,
      },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getFaqArticle: AsyncHandler = async (req, res, _next) => {
  try {
    const article = await faqRepo.getArticle(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createFaqArticle: AsyncHandler = async (req, res, _next) => {
  try {
    const authorId = req.user?.userId || req.user?.organizationId;
    const body = req.body as Partial<faqRepo.FaqArticle> & { title: string; content: string };
    const article = await faqRepo.saveArticle({
      authorId,
      ...body,
    });
    res.status(201).json({ success: true, data: article });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateFaqArticle: AsyncHandler = async (req, res, _next) => {
  try {
    const lastEditedBy = req.user?.userId || req.user?.organizationId;
    const body = req.body as Partial<faqRepo.FaqArticle> & { title: string; content: string };
    const article = await faqRepo.saveArticle({
      faqArticleId: req.params.id,
      lastEditedBy,
      ...body,
    });
    res.json({ success: true, data: article });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const publishFaqArticle: AsyncHandler = async (req, res, _next) => {
  try {
    await faqRepo.publishArticle(req.params.id);
    res.json({ success: true, message: 'Article published' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const unpublishFaqArticle: AsyncHandler = async (req, res, _next) => {
  try {
    await faqRepo.unpublishArticle(req.params.id);
    res.json({ success: true, message: 'Article unpublished' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteFaqArticle: AsyncHandler = async (req, res, _next) => {
  try {
    await faqRepo.deleteArticle(req.params.id);
    res.json({ success: true, message: 'Article deleted' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Alerts (Admin)
// ============================================================================

export const getStockAlerts: AsyncHandler = async (req, res, _next) => {
  try {
    const { customerId, productId, status, limit, offset } = req.query;
    const result = await alertRepo.getStockAlerts(
      { customerId: customerId as string, productId: productId as string, status: status as AlertStatus | undefined },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getPriceAlerts: AsyncHandler = async (req, res, _next) => {
  try {
    const { customerId, productId, status, limit, offset } = req.query;
    const result = await alertRepo.getPriceAlerts(
      { customerId: customerId as string, productId: productId as string, status: status as AlertStatus | undefined },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const notifyStockAlerts: AsyncHandler = async (req, res, _next) => {
  try {
    const { productId, productVariantId } = req.body as { productId: string; productVariantId?: string };
    const alerts = await alertRepo.getActiveStockAlertsForProduct(productId, productVariantId);

    for (const alert of alerts) {
      await alertRepo.notifyStockAlert(alert.stockAlertId);
      await JobScheduler.scheduleNotification({
        userId: alert.customerId || '',
        type: 'stock_alert',
        title: 'Back in Stock',
        message: `Your saved item is back in stock!`,
        data: { productId, productVariantId, alertId: alert.stockAlertId },
        channels: ['email', 'in_app'],
      });
    }

    res.json({ success: true, message: `Notified ${alerts.length} alerts` });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const notifyPriceAlerts: AsyncHandler = async (req, res, _next) => {
  try {
    const { productId, newPrice } = req.body as { productId: string; newPrice: number };
    const alerts = await alertRepo.getPriceAlertsToNotify(productId, newPrice);

    for (const alert of alerts) {
      await alertRepo.notifyPriceAlert(alert.priceAlertId, newPrice);
      await JobScheduler.scheduleNotification({
        userId: alert.customerId || '',
        type: 'price_alert',
        title: 'Price Drop Alert',
        message: `The price has dropped to $${newPrice}!`,
        data: { productId, newPrice, alertId: alert.priceAlertId },
        channels: ['email', 'in_app'],
      });
    }

    // Update current price for all alerts
    await alertRepo.updatePriceAlertCurrentPrice(productId, newPrice);

    res.json({ success: true, message: `Notified ${alerts.length} alerts` });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
