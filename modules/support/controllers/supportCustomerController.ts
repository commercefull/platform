/**
 * Support Customer Controller
 * Handles customer-facing support operations
 */

import { logger } from '../../../libs/logger';
import { Request, Response, NextFunction } from 'express';
import * as supportRepo from '../repos/supportRepo';
import * as faqRepo from '../repos/faqRepo';
import * as alertRepo from '../repos/alertRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Support Tickets (Customer)
// ============================================================================

export const createTicket: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    
    const ticket = await supportRepo.createTicket({
      customerId,
      orderId: req.body.orderId,
      email: req.body.email,
      name: req.body.name,
      phone: req.body.phone,
      subject: req.body.subject,
      description: req.body.description,
      priority: req.body.priority,
      category: req.body.category,
      channel: 'web'
    });

    // Add initial message if description provided
    if (req.body.description) {
      await supportRepo.addMessage({
        supportTicketId: ticket.supportTicketId,
        senderId: customerId,
        senderType: 'customer',
        senderName: req.body.name,
        senderEmail: req.body.email,
        message: req.body.description
      });
    }

    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyTickets: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { status, limit, offset } = req.query;
    
    const result = await supportRepo.getTickets(
      { customerId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTicket: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const ticket = await supportRepo.getTicket(req.params.id);
    
    if (!ticket || ticket.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }
    
    const messages = await supportRepo.getMessages(req.params.id, false); // Exclude internal
    const attachments = await supportRepo.getAttachments(req.params.id);
    
    // Mark messages as read
    await supportRepo.markMessagesRead(req.params.id, customerId);
    
    res.json({ success: true, data: { ...ticket, messages, attachments } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCustomerMessage: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const ticket = await supportRepo.getTicket(req.params.id);
    
    if (!ticket || ticket.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.status === 'closed') {
      res.status(400).json({ success: false, message: 'Cannot reply to closed ticket' });
      return;
    }

    const message = await supportRepo.addMessage({
      supportTicketId: req.params.id,
      senderId: customerId,
      senderType: 'customer',
      senderName: req.body.name || ticket.name,
      senderEmail: req.body.email || ticket.email,
      message: req.body.message
    });

    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitTicketFeedback: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const ticket = await supportRepo.getTicket(req.params.id);
    
    if (!ticket || ticket.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      res.status(400).json({ success: false, message: 'Can only submit feedback for resolved tickets' });
      return;
    }

    const { satisfaction, feedback } = req.body;
    if (satisfaction < 1 || satisfaction > 5) {
      res.status(400).json({ success: false, message: 'Satisfaction must be between 1 and 5' });
      return;
    }

    await supportRepo.submitFeedback(req.params.id, satisfaction, feedback);
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// FAQ (Public)
// ============================================================================

export const getFaqCategories: AsyncHandler = async (req, res, next) => {
  try {
    const categories = await faqRepo.getCategories(true);
    res.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedFaqCategories: AsyncHandler = async (req, res, next) => {
  try {
    const categories = await faqRepo.getFeaturedCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqCategoryBySlug: AsyncHandler = async (req, res, next) => {
  try {
    const category = await faqRepo.getCategoryBySlug(req.params.slug);
    if (!category || !category.isActive) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    
    const articles = await faqRepo.getArticles(
      { faqCategoryId: category.faqCategoryId, isPublished: true },
      { limit: 100, offset: 0 }
    );
    
    res.json({ success: true, data: { ...category, articles: articles.data } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqArticleBySlug: AsyncHandler = async (req, res, next) => {
  try {
    const article = await faqRepo.getArticleBySlug(req.params.slug);
    if (!article || !article.isPublished) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }
    
    // Increment views
    const sessionKey = `faq_view_${article.faqArticleId}`;
    const isUnique = !(req as any).session?.[sessionKey];
    await faqRepo.incrementViews(article.faqArticleId, isUnique);
    if ((req as any).session) {
      (req as any).session[sessionKey] = true;
    }
    
    // Get related articles
    const relatedArticles = await faqRepo.getRelatedArticles(article.faqArticleId);
    
    res.json({ success: true, data: { ...article, relatedArticles } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchFaq: AsyncHandler = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      res.status(400).json({ success: false, message: 'Search query required' });
      return;
    }
    
    const articles = await faqRepo.searchArticles(q as string, parseInt(limit as string) || 10);
    res.json({ success: true, data: articles });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPopularFaqArticles: AsyncHandler = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const articles = await faqRepo.getPopularArticles(parseInt(limit as string) || 10);
    res.json({ success: true, data: articles });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitFaqFeedback: AsyncHandler = async (req, res, next) => {
  try {
    const { isHelpful } = req.body;
    await faqRepo.submitHelpfulVote(req.params.id, isHelpful);
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Stock Alerts (Customer)
// ============================================================================

export const createStockAlert: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    
    const alert = await alertRepo.createStockAlert({
      customerId,
      email: req.body.email,
      phone: req.body.phone,
      productId: req.body.productId,
      productVariantId: req.body.productVariantId,
      productName: req.body.productName,
      variantName: req.body.variantName,
      sku: req.body.sku,
      desiredQuantity: req.body.desiredQuantity,
      notificationChannel: req.body.notificationChannel
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyStockAlerts: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { status, limit, offset } = req.query;
    
    const result = await alertRepo.getStockAlerts(
      { customerId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelMyStockAlert: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const alert = await alertRepo.getStockAlert(req.params.id);
    
    if (!alert || alert.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    await alertRepo.cancelStockAlert(req.params.id);
    res.json({ success: true, message: 'Alert cancelled' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Price Alerts (Customer)
// ============================================================================

export const createPriceAlert: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    
    const alert = await alertRepo.createPriceAlert({
      customerId,
      email: req.body.email,
      phone: req.body.phone,
      productId: req.body.productId,
      productVariantId: req.body.productVariantId,
      productName: req.body.productName,
      variantName: req.body.variantName,
      sku: req.body.sku,
      alertType: req.body.alertType,
      targetPrice: req.body.targetPrice,
      percentageDrop: req.body.percentageDrop,
      originalPrice: req.body.originalPrice,
      currentPrice: req.body.currentPrice,
      currency: req.body.currency,
      notificationChannel: req.body.notificationChannel
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyPriceAlerts: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { status, limit, offset } = req.query;
    
    const result = await alertRepo.getPriceAlerts(
      { customerId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelMyPriceAlert: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const alert = await alertRepo.getPriceAlert(req.params.id);
    
    if (!alert || alert.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    await alertRepo.cancelPriceAlert(req.params.id);
    res.json({ success: true, message: 'Alert cancelled' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, message: error.message });
  }
};
