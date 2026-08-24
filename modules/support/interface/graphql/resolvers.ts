import supportDataRepository from '../../infrastructure/repositories/SupportDataRepository';
import supportInfoRepository from '../../infrastructure/repositories/SupportInfoRepository';
import type { TicketPriority, TicketCategory, SenderType, SupportTicket } from '../../infrastructure/repositories/SupportDataRepository';
import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateTicketUseCase, CreateTicketInput } from '../../application/useCases/CreateTicket';
import { UpdateTicketUseCase, UpdateTicketInput } from '../../application/useCases/UpdateTicket';
import { GetCustomerTicketsUseCase, GetCustomerTicketsInput } from '../../application/useCases/GetCustomerTickets';
import { AddTicketCommentUseCase, AddTicketCommentInput } from '../../application/useCases/AddTicketComment';
import { SearchFAQUseCase, SearchFAQInput } from '../../application/useCases/SearchFAQ';
import type { FaqArticle } from '../../infrastructure/repositories/SupportInfoRepository';

const supportRepo = supportDataRepository.tickets;
const faqRepo = supportInfoRepository.faq;

// Adapters that bridge the supportRepo functions to the port interfaces expected by use cases
const ticketQueryAdapter = {
  async findTickets(filters: Record<string, unknown>, pagination: { page: number; limit: number }) {
    const offset = (pagination.page - 1) * pagination.limit;
    const result = await supportRepo.getTickets(
      filters as Parameters<typeof supportRepo.getTickets>[0],
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
    const result = await supportRepo.getTickets(
      filters as Parameters<typeof supportRepo.getTickets>[0],
      { limit: 0, offset: 0 },
    );
    return result.total;
  },
};

const faqSearchAdapter = {
  async searchFAQ(params: { query: string; categoryId?: string; limit: number }) {
    const articles = await faqRepo.searchArticles(params.query, params.limit);
    return articles.map((a: FaqArticle) => ({
      faqId: a.faqArticleId,
      question: a.title,
      answer: a.content,
      categoryName: undefined,
      helpfulness: a.helpfulScore,
    }));
  },
};

const ticketCommandAdapter = {
  async findTicketById(ticketId: string) {
    const ticket = await supportRepo.getTicket(ticketId);
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
    const ticket = await supportRepo.createTicket({
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
    const ticket = await supportRepo.updateTicket(ticketId, data as Partial<SupportTicket>);
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
    const message = await supportRepo.addMessage({
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

export const supportResolvers = {
  Query: {
    customerTickets: async (_parent: unknown, args: GetCustomerTicketsInput, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new GetCustomerTicketsUseCase(ticketQueryAdapter);
      return useCase.execute(args);
    },

    searchFAQ: async (_parent: unknown, args: { input: SearchFAQInput }) => {
      const useCase = new SearchFAQUseCase(faqSearchAdapter);
      return useCase.execute(args.input);
    },
  },

  Mutation: {
    createTicket: async (_parent: unknown, args: { input: CreateTicketInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CreateTicketUseCase(ticketCommandAdapter);
      return useCase.execute(args.input);
    },

    updateTicket: async (_parent: unknown, args: { input: UpdateTicketInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new UpdateTicketUseCase(ticketCommandAdapter);
      return useCase.execute(args.input);
    },

    addTicketComment: async (_parent: unknown, args: { input: AddTicketCommentInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new AddTicketCommentUseCase(ticketCommandAdapter);
      return useCase.execute(args.input);
    },
  },
};
