/**
 * Support Customer Controller
 * Handles customer-facing support operations
 */

import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import supportDataRepository from '../../infrastructure/repositories/SupportDataRepository';
import supportInfoRepository from '../../infrastructure/repositories/SupportInfoRepository';
import type { AlertStatus, NotificationChannel, PriceAlertType } from '../../infrastructure/repositories/SupportInfoRepository';
import type { TicketStatus, TicketPriority, TicketCategory } from '../../infrastructure/repositories/SupportDataRepository';

const supportRepo = supportDataRepository.tickets;
const faqRepo = supportInfoRepository.faq;
const alertRepo = supportInfoRepository.alerts;

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

// ============================================================================
// Support Tickets (Customer)
// ============================================================================

export const createTicket: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const body = req.body as {
    orderId?: string;
    email: string;
    name?: string;
    phone?: string;
    subject: string;
    description?: string;
    priority?: string;
    category?: string;
  };

  const ticket = await supportRepo.createTicket({
    customerId,
    orderId: body.orderId,
    email: body.email || req.user?.email || '',
    name: body.name || req.user?.name || '',
    phone: body.phone,
    subject: body.subject,
    description: body.description,
    priority: body.priority as TicketPriority | undefined,
    category: body.category as TicketCategory | undefined,
    channel: 'web',
  });

  // Add initial message if description provided
  if (body.description) {
    await supportRepo.addMessage({
      supportTicketId: ticket.supportTicketId,
      senderId: customerId,
      senderType: 'customer',
      senderName: body.name,
      senderEmail: body.email,
      message: body.description,
    });
  }

  res.status(201).json({ success: true, data: ticket });
  
};

export const getMyTickets: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { status, limit, offset } = req.query;

  const result = await supportRepo.getTickets(
    { customerId, status: status as TicketStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
  
};

export const getMyTicket: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const ticket = await supportRepo.getTicket(req.params.id);

  if (!ticket || ticket.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Ticket not found' });
    return;
  }

  const messages = await supportRepo.getMessages(req.params.id, false); // Exclude internal
  const attachments = await supportRepo.getAttachments(req.params.id);

  // Mark messages as read
  await supportRepo.markMessagesRead(req.params.id, customerId || '');

  res.json({ success: true, data: { ...ticket, messages, attachments } });
  
};

export const addCustomerMessage: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const ticket = await supportRepo.getTicket(req.params.id);

  if (!ticket || ticket.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Ticket not found' });
    return;
  }

  if (ticket.status === 'closed') {
    res.status(400).json({ success: false, message: 'Cannot reply to closed ticket' });
    return;
  }

  const body = req.body as { name?: string; email?: string; message: string };
  const message = await supportRepo.addMessage({
    supportTicketId: req.params.id,
    senderId: customerId,
    senderType: 'customer',
    senderName: body.name || ticket.name,
    senderEmail: body.email || ticket.email,
    message: body.message,
  });

  res.status(201).json({ success: true, data: message });
  
};

export const submitTicketFeedback: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const ticket = await supportRepo.getTicket(req.params.id);

  if (!ticket || ticket.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Ticket not found' });
    return;
  }

  if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
    res.status(400).json({ success: false, message: 'Can only submit feedback for resolved tickets' });
    return;
  }

  const { satisfaction, feedback } = req.body as { satisfaction: number; feedback?: string };
  if (satisfaction < 1 || satisfaction > 5) {
    res.status(400).json({ success: false, message: 'Satisfaction must be between 1 and 5' });
    return;
  }

  await supportRepo.submitFeedback(req.params.id, satisfaction, feedback);
  res.json({ success: true, message: 'Feedback submitted' });
  
};

// ============================================================================
// FAQ (Public)
// ============================================================================

export const getFaqCategories: AsyncHandler = async (req, res, _next) => {
  const categories = await faqRepo.getCategories(true);
  res.json({ success: true, data: categories });
  
};

export const getFeaturedFaqCategories: AsyncHandler = async (req, res, _next) => {
  const categories = await faqRepo.getFeaturedCategories();
  res.json({ success: true, data: categories });
  
};

export const getFaqCategoryBySlug: AsyncHandler = async (req, res, _next) => {
  const category = await faqRepo.getCategoryBySlug(req.params.slug);
  if (!category || !category.isActive) {
    res.status(404).json({ success: false, message: 'Category not found' });
    return;
  }

  const articles = await faqRepo.getArticles({ faqCategoryId: category.faqCategoryId, isPublished: true }, { limit: 100, offset: 0 });

  res.json({ success: true, data: { ...category, articles: articles.data } });
  
};

export const getFaqArticleBySlug: AsyncHandler = async (req, res, _next) => {
  const article = await faqRepo.getArticleBySlug(req.params.slug);
  if (!article || !article.isPublished) {
    res.status(404).json({ success: false, message: 'Article not found' });
    return;
  }

  // Increment views
  const sessionKey = `faq_view_${article.faqArticleId}`;
  const session = req.session as unknown as Record<string, unknown> | undefined;
  const isUnique = !session?.[sessionKey];
  await faqRepo.incrementViews(article.faqArticleId, isUnique);
  if (session) {
    session[sessionKey] = true;
  }

  // Get related articles
  const relatedArticles = await faqRepo.getRelatedArticles(article.faqArticleId);

  res.json({ success: true, data: { ...article, relatedArticles } });
  
};

export const searchFaq: AsyncHandler = async (req, res, _next) => {
  const { q, limit } = req.query;
  if (!q) {
    res.status(400).json({ success: false, message: 'Search query required' });
    return;
  }

  const articles = await faqRepo.searchArticles(q as string, parseInt(limit as string) || 10);
  res.json({ success: true, data: articles });
  
};

export const getPopularFaqArticles: AsyncHandler = async (req, res, _next) => {
  const { limit } = req.query;
  const articles = await faqRepo.getPopularArticles(parseInt(limit as string) || 10);
  res.json({ success: true, data: articles });
  
};

export const submitFaqFeedback: AsyncHandler = async (req, res, _next) => {
  const { isHelpful } = req.body as { isHelpful: boolean };
  await faqRepo.submitHelpfulVote(req.params.id, isHelpful);
  res.json({ success: true, message: 'Feedback submitted' });
  
};

// ============================================================================
// Stock Alerts (Customer)
// ============================================================================

export const createStockAlert: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const body = req.body as {
    email?: string;
    phone?: string;
    productId: string;
    productVariantId?: string;
    productName?: string;
    variantName?: string;
    sku?: string;
    desiredQuantity?: number;
    notificationChannel?: NotificationChannel;
  };

  const alert = await alertRepo.createStockAlert({
    customerId,
    email: body.email,
    phone: body.phone,
    productId: body.productId,
    productVariantId: body.productVariantId,
    productName: body.productName,
    variantName: body.variantName,
    sku: body.sku,
    desiredQuantity: body.desiredQuantity,
    notificationChannel: body.notificationChannel,
  });

  res.status(201).json({ success: true, data: alert });
  
};

export const getMyStockAlerts: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { status, limit, offset } = req.query;

  const result = await alertRepo.getStockAlerts(
    { customerId, status: status as AlertStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
  
};

export const cancelMyStockAlert: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const alert = await alertRepo.getStockAlert(req.params.id);

  if (!alert || alert.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Alert not found' });
    return;
  }

  await alertRepo.cancelStockAlert(req.params.id);
  res.json({ success: true, message: 'Alert cancelled' });
  
};

// ============================================================================
// Price Alerts (Customer)
// ============================================================================

export const createPriceAlert: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const body = req.body as {
    email?: string;
    phone?: string;
    productId: string;
    productVariantId?: string;
    productName?: string;
    variantName?: string;
    sku?: string;
    alertType?: PriceAlertType;
    targetPrice?: number;
    percentageDrop?: number;
    originalPrice?: number;
    currentPrice?: number;
    currency?: string;
    notificationChannel?: NotificationChannel;
  };

  const alert = await alertRepo.createPriceAlert({
    customerId,
    email: body.email,
    phone: body.phone,
    productId: body.productId,
    productVariantId: body.productVariantId,
    productName: body.productName,
    variantName: body.variantName,
    sku: body.sku,
    alertType: body.alertType,
    targetPrice: body.targetPrice,
    percentageDrop: body.percentageDrop,
    originalPrice: body.originalPrice,
    currentPrice: body.currentPrice,
    currency: body.currency,
    notificationChannel: body.notificationChannel,
  });

  res.status(201).json({ success: true, data: alert });
  
};

export const getMyPriceAlerts: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { status, limit, offset } = req.query;

  const result = await alertRepo.getPriceAlerts(
    { customerId, status: status as AlertStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
  
};

export const cancelMyPriceAlert: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const alert = await alertRepo.getPriceAlert(req.params.id);

  if (!alert || alert.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Alert not found' });
    return;
  }

  await alertRepo.cancelPriceAlert(req.params.id);
  res.json({ success: true, message: 'Alert cancelled' });
  
};
