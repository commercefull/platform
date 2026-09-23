import type { SupportTicketWithCustomer } from '../../domain/repositories/SupportRepository';

export interface SupportStats {
  openTickets: number;
  resolvedToday: number;
  avgResponseTime: number;
}

export interface TicketListFilters {
  status?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SupportMessageRecord {
  supportMessageId: string;
  supportTicketId: string;
  senderId?: string | null;
  senderType: string;
  senderName?: string | null;
  senderEmail?: string | null;
  message: string;
  messageHtml?: string | null;
  messageType: string | null;
  isInternal: boolean | null;
  isAutoReply: boolean | null;
  isRead: boolean | null;
  readAt?: Date | null;
  readBy?: string | null;
  metadata?: Record<string, unknown> | unknown;
  createdAt: Date | null;
}

export interface SupportAdminPort {
  getSupportStats(): Promise<SupportStats>;
  listRecentTickets(limit?: number): Promise<SupportTicketWithCustomer[]>;
  listTickets(filters: TicketListFilters): Promise<SupportTicketWithCustomer[]>;
  findTicketById(ticketId: string): Promise<SupportTicketWithCustomer | null>;
  listTicketMessages(ticketId: string): Promise<SupportMessageRecord[]>;
  updateTicketStatus(ticketId: string, status: string): Promise<void>;
  addTicketMessage(ticketId: string, message: string, senderId: string): Promise<void>;
}


export class ManageSupportTicketsUseCase {
  constructor(private readonly adminRepo: SupportAdminPort) {}

  async getSupportStats() {
    return this.adminRepo.getSupportStats();
  }
  async listRecentTickets(limit: number) {
    return this.adminRepo.listRecentTickets(limit);
  }
  async listTickets(params: TicketListFilters) {
    return this.adminRepo.listTickets(params);
  }
  async findTicketById(ticketId: string) {
    return this.adminRepo.findTicketById(ticketId);
  }
  async listTicketMessages(ticketId: string) {
    return this.adminRepo.listTicketMessages(ticketId);
  }
  async updateTicketStatus(ticketId: string, status: string) {
    return this.adminRepo.updateTicketStatus(ticketId, status);
  }
  async addTicketMessage(ticketId: string, message: string, userId: string) {
    return this.adminRepo.addTicketMessage(ticketId, message, userId);
  }
}

