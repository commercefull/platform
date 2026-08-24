jest.mock('../../infrastructure/repositories/SupportDataRepository', () => ({
  __esModule: true,
  default: {
    tickets: {
      getAgent: jest.fn().mockResolvedValue({ agentId: 'a1' }),
      getAgentByEmail: jest.fn().mockResolvedValue({ agentId: 'a1' }),
      getAgents: jest.fn().mockResolvedValue([{ agentId: 'a1' }]),
      createTicket: jest.fn().mockResolvedValue({ ticketId: 't1' }),
      getTicket: jest.fn().mockResolvedValue({ ticketId: 't1' }),
      getTickets: jest.fn().mockResolvedValue({ data: [{ ticketId: 't1' }], total: 1 }),
      addMessage: jest.fn().mockResolvedValue({ messageId: 'm1' }),
      getMessages: jest.fn().mockResolvedValue([{ messageId: 'm1' }]),
      getAttachments: jest.fn().mockResolvedValue([{ attachmentId: 'att1' }]),
      markMessagesRead: jest.fn().mockResolvedValue(true),
      submitFeedback: jest.fn().mockResolvedValue(true),
    },
    admin: {},
  },
}));

import { ManageStorefrontSupportUseCase } from './ManageStorefrontSupport';

describe('ManageStorefrontSupportUseCase', () => {
  let useCase: ManageStorefrontSupportUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStorefrontSupportUseCase();
  });

  it('should get agent', async () => {
    const result = await useCase.getAgent('a1');
    expect(result).toEqual({ agentId: 'a1' });
  });

  it('should create ticket', async () => {
    const result = await useCase.createTicket({ subject: 'Help' } as never);
    expect(result).toEqual({ ticketId: 't1' });
  });

  it('should get ticket', async () => {
    const result = await useCase.getTicket('t1');
    expect(result).toEqual({ ticketId: 't1' });
  });

  it('should add message', async () => {
    const result = await useCase.addMessage({ ticketId: 't1', message: 'Hi' } as never);
    expect(result).toEqual({ messageId: 'm1' });
  });

  it('should submit feedback', async () => {
    const result = await useCase.submitFeedback('t1', 5, 'Great');
    expect(result).toBe(true);
  });
});
