/**
 * Support Business Controller
 * Handles admin/merchant support operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import {
  manageCustomerTicketsUseCase,
  manageSupportOperationsUseCase,
  manageFaqUseCase,
  manageStockAlertsUseCase,
} from '../../application/wired';
import {
  AlertStatus,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  SupportAgent,
  SupportTicket,
  FaqCategory,
  FaqArticle,
} from '../../application/wired';

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

// ============================================================================
// Support Agents
// ============================================================================

export const getAgents: AsyncHandler = async (req, res, _next) => {
  const { isActive, isAvailable, department } = req.query;
  const agents = await manageSupportOperationsUseCase.listAgents({
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
    department: department as string,
  });
  res.json({ success: true, data: agents });
};

export const getAgent: AsyncHandler = async (req, res, _next) => {
  const agent = await manageSupportOperationsUseCase.getAgent(req.params.id);
  if (!agent) {
    res.status(404).json({ success: false, message: 'Agent not found' });
    return;
  }
  res.json({ success: true, data: agent });
};

export const createAgent: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<SupportAgent> & { email: string; firstName: string; lastName: string };
  const agent = await manageSupportOperationsUseCase.saveAgent(body as Record<string, unknown>);
  res.status(201).json({ success: true, data: agent });
};

export const updateAgent: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<SupportAgent>;
  const agent = await manageSupportOperationsUseCase.saveAgent({
    supportAgentId: req.params.id,
    ...body,
  } as Record<string, unknown>);
  res.json({ success: true, data: agent });
};

// ============================================================================
// Support Tickets (Admin)
// ============================================================================

export const getTickets: AsyncHandler = async (req, res, _next) => {
  const { customerId, assignedAgentId, status, priority, category, isEscalated, limit, offset } = req.query;
  const result = await manageSupportOperationsUseCase.listTickets(
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
};

export const getTicket: AsyncHandler = async (req, res, _next) => {
  const detail = await manageSupportOperationsUseCase.getTicketDetail(req.params.id);
  if (!detail) {
    res.status(404).json({ success: false, message: 'Ticket not found' });
    return;
  }

  res.json({ success: true, data: detail });
};

export const updateTicket: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<SupportTicket>;
  const ticket = await manageSupportOperationsUseCase.updateTicket(req.params.id, body as Record<string, unknown>);
  res.json({ success: true, data: ticket });
};

export const assignTicket: AsyncHandler = async (req, res, _next) => {
  const { agentId } = req.body as { agentId: string };
  const ticket = await manageSupportOperationsUseCase.assignTicket(req.params.id, agentId);
  res.json({ success: true, data: ticket });
};

export const resolveTicket: AsyncHandler = async (req, res, _next) => {
  const { resolutionType, resolutionNotes } = req.body as { resolutionType: string; resolutionNotes?: string };
  await manageSupportOperationsUseCase.resolveTicket(req.params.id, resolutionType, resolutionNotes);
  res.json({ success: true, message: 'Ticket resolved' });
};

export const closeTicket: AsyncHandler = async (req, res, _next) => {
  await manageSupportOperationsUseCase.closeTicket(req.params.id);
  res.json({ success: true, message: 'Ticket closed' });
};

export const escalateTicket: AsyncHandler = async (req, res, _next) => {
  const { escalatedTo, reason } = req.body as { escalatedTo: string; reason: string };
  await manageSupportOperationsUseCase.escalateTicket(req.params.id, escalatedTo, reason);
  res.json({ success: true, message: 'Ticket escalated' });
};

export const addAgentMessage: AsyncHandler = async (req, res, _next) => {
  const agentId = req.user?.userId || req.user?.organizationId || req.user?.id || '';
  const message = await manageCustomerTicketsUseCase.addAgentMessage(
    req.params.id,
    agentId,
    req.body as { message: string; messageHtml?: string; isInternal?: boolean },
  );

  res.status(201).json({ success: true, data: message });
};

// ============================================================================
// FAQ Categories (Admin)
// ============================================================================

export const getFaqCategories: AsyncHandler = async (req, res, _next) => {
  const { activeOnly } = req.query;
  const categories = await manageFaqUseCase.getCategories(activeOnly !== 'false');
  res.json({ success: true, data: categories });
};

export const getFaqCategory: AsyncHandler = async (req, res, _next) => {
  const category = await manageFaqUseCase.getCategory(req.params.id);
  if (!category) {
    res.status(404).json({ success: false, message: 'Category not found' });
    return;
  }
  res.json({ success: true, data: category });
};

export const createFaqCategory: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<FaqCategory> & { name: string };
  const category = await manageFaqUseCase.saveCategory(body);
  res.status(201).json({ success: true, data: category });
};

export const updateFaqCategory: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<FaqCategory>;
  const category = await manageFaqUseCase.saveCategory({
    faqCategoryId: req.params.id,
    ...body,
  } as Partial<FaqCategory> & { name: string });
  res.json({ success: true, data: category });
};

export const deleteFaqCategory: AsyncHandler = async (req, res, _next) => {
  await manageFaqUseCase.deleteCategory(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
};

// ============================================================================
// FAQ Articles (Admin)
// ============================================================================

export const getFaqArticles: AsyncHandler = async (req, res, _next) => {
  const { faqCategoryId, isPublished, isFeatured, limit, offset } = req.query;
  const result = await manageFaqUseCase.getArticles(
    {
      faqCategoryId: faqCategoryId as string,
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
    },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const getFaqArticle: AsyncHandler = async (req, res, _next) => {
  const article = await manageFaqUseCase.getArticle(req.params.id);
  if (!article) {
    res.status(404).json({ success: false, message: 'Article not found' });
    return;
  }
  res.json({ success: true, data: article });
};

export const createFaqArticle: AsyncHandler = async (req, res, _next) => {
  const authorId = req.user?.userId || req.user?.organizationId;
  const body = req.body as Partial<FaqArticle> & { title: string; content: string };
  const article = await manageFaqUseCase.saveArticle({
    authorId,
    ...body,
  });
  res.status(201).json({ success: true, data: article });
};

export const updateFaqArticle: AsyncHandler = async (req, res, _next) => {
  const lastEditedBy = req.user?.userId || req.user?.organizationId;
  const body = req.body as Partial<FaqArticle> & { title: string; content: string };
  const article = await manageFaqUseCase.saveArticle({
    faqArticleId: req.params.id,
    lastEditedBy,
    ...body,
  });
  res.json({ success: true, data: article });
};

export const publishFaqArticle: AsyncHandler = async (req, res, _next) => {
  await manageFaqUseCase.publishArticle(req.params.id);
  res.json({ success: true, message: 'Article published' });
};

export const unpublishFaqArticle: AsyncHandler = async (req, res, _next) => {
  await manageFaqUseCase.unpublishArticle(req.params.id);
  res.json({ success: true, message: 'Article unpublished' });
};

export const deleteFaqArticle: AsyncHandler = async (req, res, _next) => {
  await manageFaqUseCase.deleteArticle(req.params.id);
  res.json({ success: true, message: 'Article deleted' });
};

// ============================================================================
// Alerts (Admin)
// ============================================================================

export const getStockAlerts: AsyncHandler = async (req, res, _next) => {
  const { customerId, productId, status, limit, offset } = req.query;
  const result = await manageStockAlertsUseCase.listStockAlerts(
    { customerId: customerId as string, productId: productId as string, status: status as AlertStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const getPriceAlerts: AsyncHandler = async (req, res, _next) => {
  const { customerId, productId, status, limit, offset } = req.query;
  const result = await manageStockAlertsUseCase.listPriceAlerts(
    { customerId: customerId as string, productId: productId as string, status: status as AlertStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const notifyStockAlerts: AsyncHandler = async (req, res, _next) => {
  const { productId, productVariantId } = req.body as { productId: string; productVariantId?: string };
  const notified = await manageStockAlertsUseCase.notifyStockAlerts(productId, productVariantId);

  res.json({ success: true, message: `Notified ${notified} alerts` });
};

export const notifyPriceAlerts: AsyncHandler = async (req, res, _next) => {
  const { productId, newPrice } = req.body as { productId: string; newPrice: number };
  const notified = await manageStockAlertsUseCase.notifyPriceAlerts(productId, newPrice);

  res.json({ success: true, message: `Notified ${notified} alerts` });
};
