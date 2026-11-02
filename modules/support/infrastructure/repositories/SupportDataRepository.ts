/**
 * Consolidated Support Data Repository
 *
 * Merges supportRepo, adminSupportRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Support Ticket (tickets, comments, admin operations)
 */

import {
  getAgent,
  getTicket,
  getAgentByEmail,
  getAgents,
  saveAgent,
  getTickets,
  createTicket,
  updateTicket,
  resolveTicket,
  closeTicket,
  escalateTicket,
  submitFeedback,
  getMessages,
  addMessage,
  markMessagesRead,
  getAttachments,
} from './supportRepo';
import {
  getSupportStats,
  listRecentTickets,
  listTickets,
  findTicketById,
  listTicketMessages,
  updateTicketStatus,
  addTicketMessage,
} from './adminSupportRepo';

// Re-export types for backward compatibility
export type { TicketStatus, TicketPriority, TicketCategory, TicketChannel, SenderType, SupportTicket, SupportAgent } from './supportRepo';
export type { SupportTicketWithCustomer } from './adminSupportRepo';

const supportRepo = {
  getAgent,
  getTicket,
  getAgentByEmail,
  getAgents,
  saveAgent,
  getTickets,
  createTicket,
  updateTicket,
  resolveTicket,
  closeTicket,
  escalateTicket,
  submitFeedback,
  getMessages,
  addMessage,
  markMessagesRead,
  getAttachments,
};

const adminSupportRepo = {
  getSupportStats,
  listRecentTickets,
  listTickets,
  findTicketById,
  listTicketMessages,
  updateTicketStatus,
  addTicketMessage,
};

class SupportDataRepository {
  readonly tickets = supportRepo;
  readonly admin = adminSupportRepo;
}

export default new SupportDataRepository();
