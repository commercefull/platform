/**
 * Support Repository Port
 *
 * Domain interface for support data access (tickets, messages, agents, admin operations).
 */

import type { SupportTicket, SupportMessage } from 'libs/db/types';

export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'order' | 'shipping' | 'return' | 'product' | 'payment' | 'account' | 'technical' | 'other';
export type TicketChannel = 'web' | 'email' | 'phone' | 'chat' | 'social';
export type SenderType = 'customer' | 'agent' | 'system';
export type AgentRole = 'agent' | 'supervisor' | 'admin';

export interface SupportAgent {
  supportAgentId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  role: AgentRole;
  department?: string;
  skills?: string[];
  languages?: string[];
  isActive: boolean;
  isAvailable: boolean;
  maxTickets: number;
  currentTickets: number;
  totalTicketsHandled: number;
  averageResponseTimeMinutes?: number;
  averageResolutionTimeMinutes?: number;
  satisfactionScore?: number;
  satisfactionCount: number;
  timezone: string;
  workingHours?: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicketWithCustomer extends SupportTicket {
  customerEmail?: string;
  customerName?: string;
}

export interface SupportRepository {
  // Tickets
  createTicket(params: Partial<SupportTicket> & { subject: string; email: string }): Promise<SupportTicket>;
  findTicketById(ticketId: string): Promise<SupportTicket | null>;
  findTicketByNumber(ticketNumber: string): Promise<SupportTicket | null>;
  listTickets(filters?: { status?: TicketStatus; priority?: TicketPriority; category?: TicketCategory; assignedAgentId?: string }): Promise<SupportTicket[]>;
  updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null>;
  assignTicket(ticketId: string, agentId: string): Promise<SupportTicket | null>;
  updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket | null>;
  updateTicketPriority(ticketId: string, priority: TicketPriority): Promise<SupportTicket | null>;
  deleteTicket(ticketId: string): Promise<boolean>;

  // Messages
  createMessage(params: { supportTicketId: string; senderType: SenderType; senderId?: string; message: string; attachments?: unknown[] }): Promise<SupportMessage>;
  findMessagesByTicketId(ticketId: string): Promise<SupportMessage[]>;

  // Agents
  createAgent(params: Partial<SupportAgent> & { email: string; firstName: string; lastName: string }): Promise<SupportAgent>;
  findAgentById(agentId: string): Promise<SupportAgent | null>;
  findAgentByEmail(email: string): Promise<SupportAgent | null>;
  listAgents(activeOnly?: boolean): Promise<SupportAgent[]>;
  updateAgent(agentId: string, updates: Partial<SupportAgent>): Promise<SupportAgent | null>;
  setAgentAvailability(agentId: string, isAvailable: boolean): Promise<SupportAgent | null>;
  deleteAgent(agentId: string): Promise<boolean>;

  // Admin
  getSupportStats(): Promise<{ openTickets: number; resolvedToday: number; avgResponseTime: number }>;
  listRecentTickets(limit?: number): Promise<SupportTicketWithCustomer[]>;
}
