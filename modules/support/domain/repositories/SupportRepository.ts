/**
 * Support Repository Port
 *
 * Domain interface for support data access (tickets, messages, agents, admin operations).
 */

import type {
  SupportTicketProps,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketChannel,
  SenderType,
} from '../entities/SupportTicket';


export type { TicketStatus, TicketPriority, TicketCategory, TicketChannel, SenderType };
type SupportTicket = SupportTicketProps;
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


