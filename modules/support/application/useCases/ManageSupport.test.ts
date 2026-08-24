jest.mock('../../infrastructure/repositories/SupportDataRepository', () => ({
  __esModule: true,
  default: {
    admin: {
      getSupportStats: jest.fn().mockResolvedValue({ totalTickets: 10, openTickets: 3 }),
      listRecentTickets: jest.fn().mockResolvedValue([{ ticketId: 't1' }]),
      listTickets: jest.fn().mockResolvedValue({ data: [{ ticketId: 't1' }], total: 1 }),
      findTicketById: jest.fn().mockResolvedValue({ ticketId: 't1' }),
      listTicketMessages: jest.fn().mockResolvedValue([{ messageId: 'm1' }]),
      updateTicketStatus: jest.fn().mockResolvedValue(true),
      addTicketMessage: jest.fn().mockResolvedValue({ messageId: 'm2' }),
    },
    tickets: {},
  },
}));

jest.mock('../../infrastructure/repositories/SupportInfoRepository', () => ({
  __esModule: true,
  default: {
    faq: {
      getArticles: jest.fn().mockResolvedValue({ data: [{ faqId: 'f1' }], total: 1 }),
      saveArticle: jest.fn().mockResolvedValue({ faqId: 'f2' }),
      deleteArticle: jest.fn().mockResolvedValue(true),
    },
  },
}));

import { ManageSupportTicketsUseCase, ManageFaqUseCase } from './ManageSupport';

describe('ManageSupportTicketsUseCase', () => {
  let useCase: ManageSupportTicketsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageSupportTicketsUseCase();
  });

  it('should get support stats', async () => {
    const result = await useCase.getSupportStats();
    expect(result.openTickets).toBe(3);
  });

  it('should list recent tickets', async () => {
    const result = await useCase.listRecentTickets(5);
    expect(result).toHaveLength(1);
  });

  it('should find ticket by ID', async () => {
    const result = await useCase.findTicketById('t1');
    expect(result).toEqual({ ticketId: 't1' });
  });

  it('should update ticket status', async () => {
    const result = await useCase.updateTicketStatus('t1', 'closed');
    expect(result).toBe(true);
  });
});

describe('ManageFaqUseCase', () => {
  let useCase: ManageFaqUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageFaqUseCase();
  });

  it('should get articles', async () => {
    const result = await useCase.getArticles();
    expect(result.data).toHaveLength(1);
  });

  it('should save article', async () => {
    const result = await useCase.saveArticle({ title: 'FAQ' } as never);
    expect(result).toEqual({ faqId: 'f2' });
  });

  it('should delete article', async () => {
    const result = await useCase.deleteArticle('f1');
    expect(result).toBe(true);
  });
});
