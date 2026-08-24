import supportDataRepository from '../../infrastructure/repositories/SupportDataRepository';

const supportRepo = supportDataRepository.tickets;
export type { TicketStatus, TicketPriority, TicketCategory } from '../../infrastructure/repositories/SupportDataRepository';

export class ManageStorefrontSupportUseCase {
  async getAgent(id: string) {
    return supportRepo.getAgent(id);
  }
  async getAgentByEmail(email: string) {
    return supportRepo.getAgentByEmail(email);
  }
  async getAgents(filters?: Parameters<typeof supportRepo.getAgents>[0]) {
    return supportRepo.getAgents(filters);
  }
  async createTicket(...args: Parameters<typeof supportRepo.createTicket>) {
    return supportRepo.createTicket(...args);
  }
  async getTicket(id: string) {
    return supportRepo.getTicket(id);
  }
  async getTickets(...args: Parameters<typeof supportRepo.getTickets>) {
    return supportRepo.getTickets(...args);
  }
  async addMessage(...args: Parameters<typeof supportRepo.addMessage>) {
    return supportRepo.addMessage(...args);
  }
  async getMessages(ticketId: string, includeInternal?: boolean) {
    return supportRepo.getMessages(ticketId, includeInternal);
  }
  async getAttachments(ticketId: string) {
    return supportRepo.getAttachments(ticketId);
  }
  async markMessagesRead(ticketId: string, readBy: string) {
    return supportRepo.markMessagesRead(ticketId, readBy);
  }
  async submitFeedback(ticketId: string, satisfaction: number, feedback?: string) {
    return supportRepo.submitFeedback(ticketId, satisfaction, feedback);
  }
}
