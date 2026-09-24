/**
 * Shared test helpers for the support module.
 * Typed port mocks + record factories.
 */

import type { CreateTicketUseCase } from '../application/useCases/CreateTicket';
import type { UpdateTicketUseCase } from '../application/useCases/UpdateTicket';
import type { AddTicketCommentUseCase } from '../application/useCases/AddTicketComment';
import type { GetCustomerTicketsUseCase } from '../application/useCases/GetCustomerTickets';
import type { SearchFAQUseCase } from '../application/useCases/SearchFAQ';
import type { SupportAdminPort } from '../application/useCases/ManageSupportTickets';
import type { FaqPort, FaqArticleRecord } from '../application/useCases/ManageFaq';
import type { StorefrontSupportPort } from '../application/useCases/ManageStorefrontSupport';
import type { SupportTicketProps } from '../domain/entities/SupportTicket';

export function createTicketRepository(): jest.Mocked<ConstructorParameters<typeof CreateTicketUseCase>[0]> {
  return { createTicket: jest.fn() };
}

export function createUpdateTicketRepository(): jest.Mocked<ConstructorParameters<typeof UpdateTicketUseCase>[0]> {
  return { findTicketById: jest.fn(), updateTicket: jest.fn() };
}

export function createCommentRepository(): jest.Mocked<ConstructorParameters<typeof AddTicketCommentUseCase>[0]> {
  return { findTicketById: jest.fn(), createComment: jest.fn(), updateTicket: jest.fn() };
}

export function createCustomerTicketsRepository(): jest.Mocked<ConstructorParameters<typeof GetCustomerTicketsUseCase>[0]> {
  return { findTickets: jest.fn(), countTickets: jest.fn() };
}

export function createFaqSearchRepository(): jest.Mocked<ConstructorParameters<typeof SearchFAQUseCase>[0]> {
  return { searchFAQ: jest.fn() };
}

export function createSupportAdminPort(): jest.Mocked<SupportAdminPort> {
  return {
    getSupportStats: jest.fn(),
    listRecentTickets: jest.fn(),
    listTickets: jest.fn(),
    findTicketById: jest.fn(),
    listTicketMessages: jest.fn(),
    updateTicketStatus: jest.fn(),
    addTicketMessage: jest.fn(),
  };
}

export function createFaqPort(): jest.Mocked<FaqPort> {
  return {
    getArticles: jest.fn(),
    saveArticle: jest.fn(),
    deleteArticle: jest.fn(),
  };
}

export function createStorefrontSupportPort(): jest.Mocked<StorefrontSupportPort> {
  return {
    getAgent: jest.fn(),
    getAgentByEmail: jest.fn(),
    getAgents: jest.fn(),
    createTicket: jest.fn(),
    getTicket: jest.fn(),
    getTickets: jest.fn(),
    addMessage: jest.fn(),
    getMessages: jest.fn(),
    getAttachments: jest.fn(),
    markMessagesRead: jest.fn(),
    submitFeedback: jest.fn(),
  };
}

export function createTicketRecord(overrides: Partial<SupportTicketProps> = {}): SupportTicketProps {
  return {
    supportTicketId: 'tkt-1',
    ticketNumber: 'TKT-0001',
    customerId: 'cust-1',
    email: 'customer@example.com',
    subject: 'Need help',
    status: 'open',
    priority: 'medium',
    category: 'other',
    channel: 'web',
    feedbackRequested: false,
    isEscalated: false,
    isSpam: false,
    reopenCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createFaqArticleRecord(overrides: Partial<FaqArticleRecord> = {}): FaqArticleRecord {
  return {
    faqArticleId: 'faq-1',
    title: 'How to return an order',
    content: 'You can return within 30 days.',
    views: 0,
    uniqueViews: 0,
    helpfulYes: 0,
    helpfulNo: 0,
    helpfulScore: 0,
    sortOrder: 0,
    isPublished: true,
    isFeatured: false,
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
