/**
 * Support Customer Controller
 * Handles customer-facing support operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageCustomerTicketsUseCase, manageFaqUseCase, manageStockAlertsUseCase } from '../../application/wired';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import { AlertStatus, NotificationChannel, PriceAlertType, TicketStatus, TicketPriority, TicketCategory } from '../../application/wired';


type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

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

  const ticket = await manageCustomerTicketsUseCase.createTicket({
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

  res.status(201).json({ success: true, data: ticket });
};

export const getMyTickets: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { status, limit, offset } = req.query;

  const result = await manageCustomerTicketsUseCase.getTickets(
    { customerId, status: status as TicketStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const getMyTicket: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  try {
    const data = await manageCustomerTicketsUseCase.getTicketDetail(req.params.id, customerId || '');
    res.json({ success: true, data });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const addCustomerMessage: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  try {
    const message = await manageCustomerTicketsUseCase.addCustomerMessage(
      req.params.id,
      customerId || '',
      req.body as { name?: string; email?: string; message: string },
    );
    res.status(201).json({ success: true, data: message });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const submitTicketFeedback: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { satisfaction, feedback } = req.body as { satisfaction: number; feedback?: string };
  try {
    await manageCustomerTicketsUseCase.submitFeedback(req.params.id, customerId || '', satisfaction, feedback);
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

// ============================================================================
// FAQ (Public)
// ============================================================================

export const getFaqCategories: AsyncHandler = async (req, res, _next) => {
  const categories = await manageFaqUseCase.getCategories(true);
  res.json({ success: true, data: categories });
};

export const getFeaturedFaqCategories: AsyncHandler = async (req, res, _next) => {
  const categories = await manageFaqUseCase.getFeaturedCategories();
  res.json({ success: true, data: categories });
};

export const getFaqCategoryBySlug: AsyncHandler = async (req, res, _next) => {
  const category = await manageFaqUseCase.getCategoryBySlug(req.params.slug);
  if (!category || !category.isActive) {
    res.status(404).json({ success: false, message: 'Category not found' });
    return;
  }

  const articles = await manageFaqUseCase.getArticles({ faqCategoryId: category.faqCategoryId, isPublished: true }, { limit: 100, offset: 0 });

  res.json({ success: true, data: { ...category, articles: articles.data } });
};

export const getFaqArticleBySlug: AsyncHandler = async (req, res, _next) => {
  const article = await manageFaqUseCase.getArticleBySlug(req.params.slug);
  if (!article || !article.isPublished) {
    res.status(404).json({ success: false, message: 'Article not found' });
    return;
  }

  // Increment views
  const sessionKey = `faq_view_${article.faqArticleId}`;
  const session = req.session as unknown as Record<string, unknown> | undefined;
  const isUnique = !session?.[sessionKey];
  await manageFaqUseCase.incrementViews(article.faqArticleId, isUnique);
  if (session) {
    session[sessionKey] = true;
  }

  // Get related articles
  const relatedArticles = await manageFaqUseCase.getRelatedArticles(article.faqArticleId);

  res.json({ success: true, data: { ...article, relatedArticles } });
};

export const searchFaq: AsyncHandler = async (req, res, _next) => {
  const { q, limit } = req.query;
  if (!q) {
    res.status(400).json({ success: false, message: 'Search query required' });
    return;
  }

  const articles = await manageFaqUseCase.searchArticles(q as string, parseInt(limit as string) || 10);
  res.json({ success: true, data: articles });
};

export const getPopularFaqArticles: AsyncHandler = async (req, res, _next) => {
  const { limit } = req.query;
  const articles = await manageFaqUseCase.getPopularArticles(parseInt(limit as string) || 10);
  res.json({ success: true, data: articles });
};

export const submitFaqFeedback: AsyncHandler = async (req, res, _next) => {
  const { isHelpful } = req.body as { isHelpful: boolean };
  await manageFaqUseCase.submitHelpfulVote(req.params.id, isHelpful);
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

  const alert = await manageStockAlertsUseCase.createStockAlert({
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

  const result = await manageStockAlertsUseCase.listStockAlerts(
    { customerId, status: status as AlertStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const cancelMyStockAlert: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const alert = await manageStockAlertsUseCase.getStockAlert(req.params.id);

  if (!alert || alert.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Alert not found' });
    return;
  }

  await manageStockAlertsUseCase.cancelStockAlert(req.params.id);
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

  const toCents = (v?: number) => (v != null ? Math.round(Number(v) * 100) : undefined);
  const alert = await manageStockAlertsUseCase.createPriceAlert({
    customerId,
    email: body.email,
    phone: body.phone,
    productId: body.productId,
    productVariantId: body.productVariantId,
    productName: body.productName,
    variantName: body.variantName,
    sku: body.sku,
    alertType: body.alertType,
    targetPriceCents: toCents(body.targetPrice),
    percentageDrop: body.percentageDrop,
    originalPriceCents: toCents(body.originalPrice),
    currentPriceCents: toCents(body.currentPrice),
    currency: body.currency,
    notificationChannel: body.notificationChannel,
  });

  res.status(201).json({ success: true, data: alert });
};

export const getMyPriceAlerts: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { status, limit, offset } = req.query;

  const result = await manageStockAlertsUseCase.listPriceAlerts(
    { customerId, status: status as AlertStatus | undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const cancelMyPriceAlert: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const alert = await manageStockAlertsUseCase.getPriceAlert(req.params.id);

  if (!alert || alert.customerId !== customerId) {
    res.status(404).json({ success: false, message: 'Alert not found' });
    return;
  }

  await manageStockAlertsUseCase.cancelPriceAlert(req.params.id);
  res.json({ success: true, message: 'Alert cancelled' });
};
