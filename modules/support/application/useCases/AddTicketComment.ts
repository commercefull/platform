/**
 * AddTicketComment Use Case
 */

import { SupportTicketNotFoundError, SupportValidationError } from '../../domain/errors/SupportErrors';

export interface AddTicketCommentInput {
  ticketId: string;
  authorId: string;
  authorType: 'customer' | 'agent' | 'system';
  content: string;
  isInternal?: boolean;
  attachments?: string[];
}

export interface AddTicketCommentOutput {
  commentId: string;
  ticketId: string;
  authorType: string;
  isInternal: boolean;
  createdAt: string;
}

interface TicketRecord {
  ticketId: string;
  status: string;
}

interface CommentRecord {
  commentId: string;
  ticketId: string;
  authorType: string;
  isInternal: boolean;
  createdAt: Date;
}

interface SupportRepository {
  findTicketById(ticketId: string): Promise<TicketRecord | null>;
  createComment(data: {
    commentId: string;
    ticketId: string;
    authorId: string;
    authorType: string;
    content: string;
    isInternal: boolean;
    attachments: string[];
  }): Promise<CommentRecord>;
  updateTicket(ticketId: string, data: Record<string, unknown>): Promise<unknown>;
}

export class AddTicketCommentUseCase {
  constructor(private readonly supportRepository: SupportRepository) {}

  async execute(input: AddTicketCommentInput): Promise<AddTicketCommentOutput> {
    if (!input.ticketId || !input.authorId || !input.content) {
      throw new SupportValidationError('Ticket ID, author ID, and content are required');
    }

    const ticket = await this.supportRepository.findTicketById(input.ticketId);
    if (!ticket) {
      throw new SupportTicketNotFoundError(input.ticketId);
    }

    // Customers cannot add internal comments
    if (input.authorType === 'customer' && input.isInternal) {
      throw new SupportValidationError('Customers cannot add internal comments');
    }

    const commentId = `cmt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const comment = await this.supportRepository.createComment({
      commentId,
      ticketId: input.ticketId,
      authorId: input.authorId,
      authorType: input.authorType,
      content: input.content,
      isInternal: input.isInternal ?? false,
      attachments: input.attachments || [],
    });

    // Update ticket status if customer replies to resolved ticket
    if (input.authorType === 'customer' && ticket.status === 'resolved') {
      await this.supportRepository.updateTicket(input.ticketId, {
        status: 'open',
      });
    }

    // Update last activity
    await this.supportRepository.updateTicket(input.ticketId, {
      lastActivityAt: new Date(),
    });

    return {
      commentId: comment.commentId,
      ticketId: comment.ticketId,
      authorType: comment.authorType,
      isInternal: comment.isInternal,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
