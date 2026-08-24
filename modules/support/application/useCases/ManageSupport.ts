import supportDataRepository from '../../infrastructure/repositories/SupportDataRepository';
import supportInfoRepository from '../../infrastructure/repositories/SupportInfoRepository';

const adminSupportRepo = supportDataRepository.admin;
const faqRepo = supportInfoRepository.faq;

export class ManageSupportTicketsUseCase {
  async getSupportStats() {
    return adminSupportRepo.getSupportStats();
  }
  async listRecentTickets(limit: number) {
    return adminSupportRepo.listRecentTickets(limit);
  }
  async listTickets(params: Parameters<typeof adminSupportRepo.listTickets>[0]) {
    return adminSupportRepo.listTickets(params);
  }
  async findTicketById(ticketId: string) {
    return adminSupportRepo.findTicketById(ticketId);
  }
  async listTicketMessages(ticketId: string) {
    return adminSupportRepo.listTicketMessages(ticketId);
  }
  async updateTicketStatus(ticketId: string, status: string) {
    return adminSupportRepo.updateTicketStatus(ticketId, status);
  }
  async addTicketMessage(ticketId: string, message: string, userId: string) {
    return adminSupportRepo.addTicketMessage(ticketId, message, userId);
  }
}

export class ManageFaqUseCase {
  async getArticles(filters?: Parameters<typeof faqRepo.getArticles>[0], pagination?: Parameters<typeof faqRepo.getArticles>[1]) {
    return faqRepo.getArticles(filters, pagination);
  }
  async saveArticle(params: Parameters<typeof faqRepo.saveArticle>[0]) {
    return faqRepo.saveArticle(params);
  }
  async deleteArticle(faqId: string) {
    return faqRepo.deleteArticle(faqId);
  }
}
