import type {
  SupportTicketProps,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketChannel,
  SenderType,
} from '../../domain/entities/SupportTicket';
import type { SupportAgent } from '../../domain/repositories/SupportRepository';
import type { SupportMessageRecord } from './ManageSupportTickets';

export type { TicketStatus, TicketPriority, TicketCategory } from '../../domain/repositories/SupportRepository';

export interface StorefrontTicketCreateParams {
  customerId?: string;
  orderId?: string;
  email: string;
  name?: string;
  phone?: string;
  subject: string;
  description?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  channel?: TicketChannel;
}

export interface StorefrontMessageParams {
  supportTicketId: string;
  senderId?: string;
  senderType: SenderType;
  senderName?: string;
  senderEmail?: string;
  message: string;
  messageHtml?: string;
  messageType?: string;
  isInternal?: boolean;
  isAutoReply?: boolean;
}

export interface StorefrontTicketFilters {
  customerId?: string;
  assignedAgentId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  isEscalated?: boolean;
}

export interface SupportAttachmentRecord {
  supportAttachmentId: string;
  supportTicketId: string;
  supportMessageId?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  uploadedBy?: string;
  uploadedByType?: string;
  isPublic: boolean;
  isScanned: boolean;
  isSafe: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface StorefrontSupportPort {
  getAgent(supportAgentId: string): Promise<SupportAgent | null>;
  getAgentByEmail(email: string): Promise<SupportAgent | null>;
  getAgents(filters?: { isActive?: boolean; isAvailable?: boolean; department?: string }): Promise<SupportAgent[]>;
  createTicket(ticket: StorefrontTicketCreateParams): Promise<SupportTicketProps>;
  getTicket(supportTicketId: string): Promise<SupportTicketProps | null>;
  getTickets(
    filters?: StorefrontTicketFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: SupportTicketProps[]; total: number }>;
  addMessage(message: StorefrontMessageParams): Promise<SupportMessageRecord>;
  getMessages(supportTicketId: string, includeInternal?: boolean): Promise<SupportMessageRecord[]>;
  getAttachments(supportTicketId: string): Promise<SupportAttachmentRecord[]>;
  markMessagesRead(supportTicketId: string, readBy: string): Promise<void>;
  submitFeedback(supportTicketId: string, satisfaction: number, feedback?: string): Promise<void>;
}

export class ManageStorefrontSupportUseCase {
  constructor(private readonly supportRepo: StorefrontSupportPort) {}

  async getAgent(id: string) {
    return this.supportRepo.getAgent(id);
  }
  async getAgentByEmail(email: string) {
    return this.supportRepo.getAgentByEmail(email);
  }
  async getAgents(filters?: { isActive?: boolean; isAvailable?: boolean; department?: string }) {
    return this.supportRepo.getAgents(filters);
  }
  async createTicket(...args: Parameters<StorefrontSupportPort['createTicket']>) {
    return this.supportRepo.createTicket(...args);
  }
  async getTicket(id: string) {
    return this.supportRepo.getTicket(id);
  }
  async getTickets(...args: Parameters<StorefrontSupportPort['getTickets']>) {
    return this.supportRepo.getTickets(...args);
  }
  async addMessage(...args: Parameters<StorefrontSupportPort['addMessage']>) {
    return this.supportRepo.addMessage(...args);
  }
  async getMessages(ticketId: string, includeInternal?: boolean) {
    return this.supportRepo.getMessages(ticketId, includeInternal);
  }
  async getAttachments(ticketId: string) {
    return this.supportRepo.getAttachments(ticketId);
  }
  async markMessagesRead(ticketId: string, readBy: string) {
    return this.supportRepo.markMessagesRead(ticketId, readBy);
  }
  async submitFeedback(ticketId: string, satisfaction: number, feedback?: string) {
    return this.supportRepo.submitFeedback(ticketId, satisfaction, feedback);
  }
}
