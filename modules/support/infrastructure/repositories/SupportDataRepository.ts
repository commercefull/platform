/**
 * Consolidated Support Data Repository
 *
 * Merges supportRepo, adminSupportRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Support Ticket (tickets, comments, admin operations)
 */

import * as supportRepo from './supportRepo';
import * as adminSupportRepo from './adminSupportRepo';

// Re-export types for backward compatibility
export type { TicketStatus, TicketPriority, TicketCategory, TicketChannel, SenderType, SupportTicket, SupportAgent } from './supportRepo';
export type { SupportTicketWithCustomer } from './adminSupportRepo';

class SupportDataRepository {
  readonly tickets = supportRepo;
  readonly admin = adminSupportRepo;
}

export default new SupportDataRepository();
