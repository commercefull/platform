import supportDataRepository from '../infrastructure/repositories/SupportDataRepository';
import supportInfoRepository from '../infrastructure/repositories/SupportInfoRepository';
import type { TicketStatus, TicketPriority, TicketCategory, SupportTicket, SenderType } from '../domain/entities/SupportTicket';
import type { SupportAgent } from '../domain/repositories/SupportRepository';
import type {
  AlertStatus,
  NotificationChannel,
  PriceAlertType,
  FaqCategory,
  FaqArticle,
} from '../infrastructure/repositories/SupportInfoRepository';

import { ManageSupportTicketsUseCase } from './useCases/ManageSupportTickets';
import { ManageFaqUseCase } from './useCases/ManageFaq';
import { ManageStorefrontSupportUseCase } from './useCases/ManageStorefrontSupport';
import { ManageCustomerTicketsUseCase } from './useCases/ManageCustomerTickets';
import { ManageSupportOperationsUseCase } from './useCases/ManageSupportOperations';
import { ManageStockAlertsUseCase } from './useCases/ManageStockAlerts';
import { CreateTicketUseCase } from './useCases/CreateTicket';
import { UpdateTicketUseCase } from './useCases/UpdateTicket';
import { GetCustomerTicketsUseCase } from './useCases/GetCustomerTickets';
import { AddTicketCommentUseCase } from './useCases/AddTicketComment';
import { SearchFAQUseCase } from './useCases/SearchFAQ';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';

export const manageSupportTicketsUseCase = new ManageSupportTicketsUseCase(supportDataRepository.admin);
export const manageFaqUseCase = new ManageFaqUseCase(supportInfoRepository.faq);
export const manageStorefrontSupportUseCase = new ManageStorefrontSupportUseCase(supportDataRepository.tickets);
export const manageCustomerTicketsUseCase = new ManageCustomerTicketsUseCase(supportDataRepository.tickets);

const supportOperationsAdapter = {
  getAgents: (filters?: { isActive?: boolean; isAvailable?: boolean; department?: string }) =>
    supportDataRepository.tickets.getAgents(filters),
  getAgent: (agentId: string) => supportDataRepository.tickets.getAgent(agentId),
  saveAgent: (agent: Record<string, unknown>) =>
    supportDataRepository.tickets.saveAgent(agent as Partial<SupportAgent> & { email: string; firstName: string; lastName: string }),
  getTickets: (
    filters?: { customerId?: string; assignedAgentId?: string; status?: string; priority?: string; category?: string; isEscalated?: boolean },
    pagination?: { limit?: number; offset?: number },
  ) =>
    supportDataRepository.tickets.getTickets(
      filters as Parameters<typeof supportDataRepository.tickets.getTickets>[0],
      pagination,
    ),
  getTicket: (ticketId: string) => supportDataRepository.tickets.getTicket(ticketId),
  getMessages: (ticketId: string, includeInternal?: boolean) =>
    supportDataRepository.tickets.getMessages(ticketId, includeInternal),
  getAttachments: (ticketId: string) => supportDataRepository.tickets.getAttachments(ticketId),
  updateTicket: (ticketId: string, updates: Record<string, unknown>) =>
    supportDataRepository.tickets.updateTicket(ticketId, updates as Partial<SupportTicket>),
  resolveTicket: (ticketId: string, resolutionType: string, resolutionNotes?: string) =>
    supportDataRepository.tickets.resolveTicket(ticketId, resolutionType, resolutionNotes),
  closeTicket: (ticketId: string) => supportDataRepository.tickets.closeTicket(ticketId),
  escalateTicket: (ticketId: string, escalatedTo: string, reason: string) =>
    supportDataRepository.tickets.escalateTicket(ticketId, escalatedTo, reason),
};

export const manageSupportOperationsUseCase = new ManageSupportOperationsUseCase(supportOperationsAdapter);

const stockAlertAdapter = {
  getStockAlerts: (filters?: { customerId?: string; productId?: string; status?: string }, pagination?: { limit?: number; offset?: number }) =>
    supportInfoRepository.alerts.getStockAlerts(filters as Parameters<typeof supportInfoRepository.alerts.getStockAlerts>[0], pagination),
  getPriceAlerts: (filters?: { customerId?: string; productId?: string; status?: string }, pagination?: { limit?: number; offset?: number }) =>
    supportInfoRepository.alerts.getPriceAlerts(filters as Parameters<typeof supportInfoRepository.alerts.getPriceAlerts>[0], pagination),
  getActiveStockAlertsForProduct: (productId: string, productVariantId?: string) =>
    supportInfoRepository.alerts.getActiveStockAlertsForProduct(productId, productVariantId),
  getPriceAlertsToNotify: (productId: string, newPriceCents: number) =>
    supportInfoRepository.alerts.getPriceAlertsToNotify(productId, newPriceCents),
  notifyStockAlert: (stockAlertId: string) => supportInfoRepository.alerts.notifyStockAlert(stockAlertId),
  notifyPriceAlert: (priceAlertId: string, notifiedPriceCents: number) =>
    supportInfoRepository.alerts.notifyPriceAlert(priceAlertId, notifiedPriceCents),
  updatePriceAlertCurrentPrice: (productId: string, newPriceCents: number) =>
    supportInfoRepository.alerts.updatePriceAlertCurrentPrice(productId, newPriceCents),
  getStockAlert: (stockAlertId: string) => supportInfoRepository.alerts.getStockAlert(stockAlertId),
  createStockAlert: (alert: Parameters<typeof supportInfoRepository.alerts.createStockAlert>[0]) =>
    supportInfoRepository.alerts.createStockAlert(alert),
  cancelStockAlert: (stockAlertId: string) => supportInfoRepository.alerts.cancelStockAlert(stockAlertId),
  getPriceAlert: (priceAlertId: string) => supportInfoRepository.alerts.getPriceAlert(priceAlertId),
  createPriceAlert: (alert: Parameters<typeof supportInfoRepository.alerts.createPriceAlert>[0]) =>
    supportInfoRepository.alerts.createPriceAlert(alert),
  cancelPriceAlert: (priceAlertId: string) => supportInfoRepository.alerts.cancelPriceAlert(priceAlertId),
};

const notificationSchedulerAdapter = {
  scheduleNotification: (data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    channels?: string[];
  }) => JobScheduler.scheduleNotification({ ...data, channels: data.channels as ('email' | 'sms' | 'push' | 'in_app')[] }),
};

export const manageStockAlertsUseCase = new ManageStockAlertsUseCase(stockAlertAdapter, notificationSchedulerAdapter);

// --- GraphQL resolver adapters ------------------------------------------------
// Bridge the tickets/faq repositories to the port interfaces expected by the
// customer-facing use cases (GetCustomerTickets, CreateTicket, etc.).

const supportTicketQueryAdapter = {
  async findTickets(filters: Record<string, unknown>, pagination: { page: number; limit: number }) {
    const offset = (pagination.page - 1) * pagination.limit;
    const result = await supportDataRepository.tickets.getTickets(
      filters as Parameters<typeof supportDataRepository.tickets.getTickets>[0],
      { limit: pagination.limit, offset },
    );
    return result.data.map(t => ({
      ticketId: t.supportTicketId,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      type: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      lastActivityAt: t.lastMessageAt,
      commentCount: 0,
    }));
  },
  async countTickets(filters: Record<string, unknown>) {
    const result = await supportDataRepository.tickets.getTickets(
      filters as Parameters<typeof supportDataRepository.tickets.getTickets>[0],
      { limit: 0, offset: 0 },
    );
    return result.total;
  },
};

const supportFaqSearchAdapter = {
  async searchFAQ(params: { query: string; categoryId?: string; limit: number }) {
    const articles = await supportInfoRepository.faq.searchArticles(params.query, params.limit);
    return articles.map((a: FaqArticle) => ({
      faqId: a.faqArticleId,
      question: a.title,
      answer: a.content,
      categoryName: undefined,
      helpfulness: a.helpfulScore,
    }));
  },
};

const supportTicketCommandAdapter = {
  async findTicketById(ticketId: string) {
    const ticket = await supportDataRepository.tickets.getTicket(ticketId);
    if (!ticket) return null;
    return {
      ticketId: ticket.supportTicketId,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      type: ticket.category as string,
      priority: ticket.priority as string,
      status: ticket.status as string,
      assignedTo: ticket.assignedAgentId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  },
  async createTicket(data: {
    ticketId: string;
    ticketNumber: string;
    customerId: string;
    subject: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    orderId?: string;
    attachments: string[];
    tags: string[];
  }) {
    const ticket = await supportDataRepository.tickets.createTicket({
      customerId: data.customerId,
      email: '',
      subject: data.subject,
      description: data.description,
      priority: data.priority as TicketPriority,
      category: data.type as TicketCategory,
    });
    return {
      ticketId: ticket.supportTicketId,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      type: ticket.category as string,
      priority: ticket.priority as string,
      status: ticket.status as string,
      createdAt: ticket.createdAt,
    };
  },
  async updateTicket(ticketId: string, data: Record<string, unknown>) {
    const ticket = await supportDataRepository.tickets.updateTicket(ticketId, data as Partial<SupportTicket>);
    return {
      ticketId: ticket.supportTicketId,
      status: ticket.status as string,
      priority: ticket.priority as string,
      assignedTo: ticket.assignedAgentId,
      updatedAt: ticket.updatedAt,
    };
  },
  async createComment(data: {
    commentId: string;
    ticketId: string;
    authorId: string;
    authorType: string;
    content: string;
    isInternal: boolean;
    attachments: string[];
  }) {
    const message = await supportDataRepository.tickets.addMessage({
      supportTicketId: data.ticketId,
      senderId: data.authorId,
      senderType: data.authorType as SenderType,
      message: data.content,
      isInternal: data.isInternal,
    });
    return {
      commentId: message.supportMessageId,
      ticketId: message.supportTicketId,
      authorType: message.senderType as string,
      isInternal: message.isInternal,
      createdAt: message.createdAt,
    };
  },
};

export const getCustomerTicketsUseCase = new GetCustomerTicketsUseCase(supportTicketQueryAdapter);
export const searchFaqUseCase = new SearchFAQUseCase(supportFaqSearchAdapter);
export const createTicketUseCase = new CreateTicketUseCase(supportTicketCommandAdapter);
export const updateTicketUseCase = new UpdateTicketUseCase(supportTicketCommandAdapter);
export const addTicketCommentUseCase = new AddTicketCommentUseCase(supportTicketCommandAdapter);

export {
  supportDataRepository,
  supportInfoRepository,
  TicketPriority,
  TicketCategory,
  SenderType,
  SupportTicket,
  TicketStatus,
  SupportAgent,
  FaqArticle,
  AlertStatus,
  NotificationChannel,
  PriceAlertType,
  FaqCategory,
};
