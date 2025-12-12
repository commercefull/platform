/**
 * Support Business Controller
 * Handles admin/merchant support operations
 */

import { Request, Response, NextFunction } from 'express';
import * as supportRepo from '../repos/supportRepo';
import * as faqRepo from '../repos/faqRepo';
import * as alertRepo from '../repos/alertRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Support Agents
// ============================================================================

export const getAgents: AsyncHandler = async (req, res, next) => {
  try {
    const { isActive, isAvailable, department } = req.query;
    const agents = await supportRepo.getAgents({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      department: department as string
    });
    res.json({ success: true, data: agents });
  } catch (error: any) {
    console.error('Get agents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgent: AsyncHandler = async (req, res, next) => {
  try {
    const agent = await supportRepo.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ success: false, message: 'Agent not found' });
      return;
    }
    res.json({ success: true, data: agent });
  } catch (error: any) {
    console.error('Get agent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAgent: AsyncHandler = async (req, res, next) => {
  try {
    const agent = await supportRepo.saveAgent(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (error: any) {
    console.error('Create agent error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAgent: AsyncHandler = async (req, res, next) => {
  try {
    const agent = await supportRepo.saveAgent({
      supportAgentId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: agent });
  } catch (error: any) {
    console.error('Update agent error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Support Tickets (Admin)
// ============================================================================

export const getTickets: AsyncHandler = async (req, res, next) => {
  try {
    const { customerId, assignedAgentId, status, priority, category, isEscalated, limit, offset } = req.query;
    const result = await supportRepo.getTickets(
      {
        customerId: customerId as string,
        assignedAgentId: assignedAgentId as string,
        status: status as any,
        priority: priority as any,
        category: category as any,
        isEscalated: isEscalated === 'true' ? true : isEscalated === 'false' ? false : undefined
      },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTicket: AsyncHandler = async (req, res, next) => {
  try {
    const ticket = await supportRepo.getTicket(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }
    
    const messages = await supportRepo.getMessages(req.params.id, true);
    const attachments = await supportRepo.getAttachments(req.params.id);
    
    res.json({ success: true, data: { ...ticket, messages, attachments } });
  } catch (error: any) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicket: AsyncHandler = async (req, res, next) => {
  try {
    const ticket = await supportRepo.updateTicket(req.params.id, req.body);
    res.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Update ticket error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignTicket: AsyncHandler = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const ticket = await supportRepo.updateTicket(req.params.id, { assignedAgentId: agentId });
    res.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Assign ticket error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveTicket: AsyncHandler = async (req, res, next) => {
  try {
    const { resolutionType, resolutionNotes } = req.body;
    await supportRepo.resolveTicket(req.params.id, resolutionType, resolutionNotes);
    res.json({ success: true, message: 'Ticket resolved' });
  } catch (error: any) {
    console.error('Resolve ticket error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const closeTicket: AsyncHandler = async (req, res, next) => {
  try {
    await supportRepo.closeTicket(req.params.id);
    res.json({ success: true, message: 'Ticket closed' });
  } catch (error: any) {
    console.error('Close ticket error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const escalateTicket: AsyncHandler = async (req, res, next) => {
  try {
    const { escalatedTo, reason } = req.body;
    await supportRepo.escalateTicket(req.params.id, escalatedTo, reason);
    res.json({ success: true, message: 'Ticket escalated' });
  } catch (error: any) {
    console.error('Escalate ticket error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addAgentMessage: AsyncHandler = async (req, res, next) => {
  try {
    const agentId = (req as any).userId || (req as any).merchantId;
    const agent = await supportRepo.getAgent(agentId);
    
    const message = await supportRepo.addMessage({
      supportTicketId: req.params.id,
      senderId: agentId,
      senderType: 'agent',
      senderName: agent ? `${agent.firstName} ${agent.lastName}` : undefined,
      senderEmail: agent?.email,
      message: req.body.message,
      messageHtml: req.body.messageHtml,
      isInternal: req.body.isInternal || false
    });
    
    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    console.error('Add agent message error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// FAQ Categories (Admin)
// ============================================================================

export const getFaqCategories: AsyncHandler = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const categories = await faqRepo.getCategories(activeOnly !== 'false');
    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Get FAQ categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqCategory: AsyncHandler = async (req, res, next) => {
  try {
    const category = await faqRepo.getCategory(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Get FAQ category error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFaqCategory: AsyncHandler = async (req, res, next) => {
  try {
    const category = await faqRepo.saveCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    console.error('Create FAQ category error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFaqCategory: AsyncHandler = async (req, res, next) => {
  try {
    const category = await faqRepo.saveCategory({
      faqCategoryId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Update FAQ category error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFaqCategory: AsyncHandler = async (req, res, next) => {
  try {
    await faqRepo.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    console.error('Delete FAQ category error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// FAQ Articles (Admin)
// ============================================================================

export const getFaqArticles: AsyncHandler = async (req, res, next) => {
  try {
    const { faqCategoryId, isPublished, isFeatured, limit, offset } = req.query;
    const result = await faqRepo.getArticles(
      {
        faqCategoryId: faqCategoryId as string,
        isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
        isFeatured: isFeatured === 'true' ? true : undefined
      },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get FAQ articles error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqArticle: AsyncHandler = async (req, res, next) => {
  try {
    const article = await faqRepo.getArticle(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error: any) {
    console.error('Get FAQ article error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFaqArticle: AsyncHandler = async (req, res, next) => {
  try {
    const authorId = (req as any).userId || (req as any).merchantId;
    const article = await faqRepo.saveArticle({
      authorId,
      ...req.body
    });
    res.status(201).json({ success: true, data: article });
  } catch (error: any) {
    console.error('Create FAQ article error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFaqArticle: AsyncHandler = async (req, res, next) => {
  try {
    const lastEditedBy = (req as any).userId || (req as any).merchantId;
    const article = await faqRepo.saveArticle({
      faqArticleId: req.params.id,
      lastEditedBy,
      ...req.body
    });
    res.json({ success: true, data: article });
  } catch (error: any) {
    console.error('Update FAQ article error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const publishFaqArticle: AsyncHandler = async (req, res, next) => {
  try {
    await faqRepo.publishArticle(req.params.id);
    res.json({ success: true, message: 'Article published' });
  } catch (error: any) {
    console.error('Publish FAQ article error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const unpublishFaqArticle: AsyncHandler = async (req, res, next) => {
  try {
    await faqRepo.unpublishArticle(req.params.id);
    res.json({ success: true, message: 'Article unpublished' });
  } catch (error: any) {
    console.error('Unpublish FAQ article error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFaqArticle: AsyncHandler = async (req, res, next) => {
  try {
    await faqRepo.deleteArticle(req.params.id);
    res.json({ success: true, message: 'Article deleted' });
  } catch (error: any) {
    console.error('Delete FAQ article error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Alerts (Admin)
// ============================================================================

export const getStockAlerts: AsyncHandler = async (req, res, next) => {
  try {
    const { customerId, productId, status, limit, offset } = req.query;
    const result = await alertRepo.getStockAlerts(
      { customerId: customerId as string, productId: productId as string, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceAlerts: AsyncHandler = async (req, res, next) => {
  try {
    const { customerId, productId, status, limit, offset } = req.query;
    const result = await alertRepo.getPriceAlerts(
      { customerId: customerId as string, productId: productId as string, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get price alerts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const notifyStockAlerts: AsyncHandler = async (req, res, next) => {
  try {
    const { productId, productVariantId } = req.body;
    const alerts = await alertRepo.getActiveStockAlertsForProduct(productId, productVariantId);
    
    for (const alert of alerts) {
      await alertRepo.notifyStockAlert(alert.stockAlertId);
      // TODO: Send actual notification (email/SMS/push)
    }
    
    res.json({ success: true, message: `Notified ${alerts.length} alerts` });
  } catch (error: any) {
    console.error('Notify stock alerts error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const notifyPriceAlerts: AsyncHandler = async (req, res, next) => {
  try {
    const { productId, newPrice } = req.body;
    const alerts = await alertRepo.getPriceAlertsToNotify(productId, newPrice);
    
    for (const alert of alerts) {
      await alertRepo.notifyPriceAlert(alert.priceAlertId, newPrice);
      // TODO: Send actual notification (email/SMS/push)
    }
    
    // Update current price for all alerts
    await alertRepo.updatePriceAlertCurrentPrice(productId, newPrice);
    
    res.json({ success: true, message: `Notified ${alerts.length} alerts` });
  } catch (error: any) {
    console.error('Notify price alerts error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
