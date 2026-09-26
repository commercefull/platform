import { ManageCustomerTicketsUseCase, type ManageCustomerTicketsPort } from './ManageCustomerTickets';
import { SupportTicketNotFoundError, SupportValidationError } from '../../domain/errors/SupportErrors';

const lazyMock = <T extends object>(): jest.Mocked<T> => {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_t, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
};

const ticket = { supportTicketId: 't-1', customerId: 'cust-1', status: 'open', name: 'Alice', email: 'a@b.c' };
const message = { supportMessageId: 'msg-1' };

describe('ManageCustomerTicketsUseCase', () => {
  let support: jest.Mocked<ManageCustomerTicketsPort>;
  let useCase: ManageCustomerTicketsUseCase;

  beforeEach(() => {
    support = lazyMock<ManageCustomerTicketsPort>();
    useCase = new ManageCustomerTicketsUseCase(support);
  });

  describe('createTicket', () => {
    it('should add the description as the first message', async () => {
      support.createTicket.mockResolvedValue(ticket);

      await useCase.createTicket({ customerId: 'cust-1', email: 'a@b.c', subject: 'Help', description: 'Broken' });

      expect(support.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ supportTicketId: 't-1', senderType: 'customer', message: 'Broken' }),
      );
    });

    it('should skip the initial message when no description is given', async () => {
      support.createTicket.mockResolvedValue(ticket);

      await useCase.createTicket({ customerId: 'cust-1', email: 'a@b.c', subject: 'Help' });

      expect(support.addMessage).not.toHaveBeenCalled();
    });
  });

  describe('getTicketDetail', () => {
    it('should reject another customer\'s ticket', async () => {
      support.getTicket.mockResolvedValue(ticket);
      await expect(useCase.getTicketDetail('t-1', 'cust-2')).rejects.toBeInstanceOf(SupportTicketNotFoundError);
    });

    it('should compose ticket + messages + attachments and mark read', async () => {
      support.getTicket.mockResolvedValue(ticket);
      support.getMessages.mockResolvedValue([{ supportMessageId: 'm1' }]);
      support.getAttachments.mockResolvedValue([{ id: 'att-1' }]);

      const result = await useCase.getTicketDetail('t-1', 'cust-1');

      expect(support.getMessages).toHaveBeenCalledWith('t-1', false);
      expect(support.markMessagesRead).toHaveBeenCalledWith('t-1', 'cust-1');
      expect(result).toMatchObject({ supportTicketId: 't-1', messages: [{ supportMessageId: 'm1' }] });
    });
  });

  describe('addCustomerMessage', () => {
    it('should reject replies on a closed ticket', async () => {
      support.getTicket.mockResolvedValue({ ...ticket, status: 'closed' });
      await expect(useCase.addCustomerMessage('t-1', 'cust-1', { message: 'hi' })).rejects.toBeInstanceOf(
        SupportValidationError,
      );
      expect(support.addMessage).not.toHaveBeenCalled();
    });

    it('should reject another customer\'s ticket', async () => {
      support.getTicket.mockResolvedValue(ticket);
      await expect(useCase.addCustomerMessage('t-1', 'cust-2', { message: 'hi' })).rejects.toBeInstanceOf(
        SupportTicketNotFoundError,
      );
    });

    it('should add a message enriched from the ticket', async () => {
      support.getTicket.mockResolvedValue(ticket);
      support.addMessage.mockResolvedValue(message);

      const result = await useCase.addCustomerMessage('t-1', 'cust-1', { message: 'hi' });

      expect(support.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ senderName: 'Alice', senderEmail: 'a@b.c', senderType: 'customer' }),
      );
      expect(result).toBe(message);
    });
  });

  describe('submitFeedback', () => {
    it('should reject feedback on an open ticket', async () => {
      support.getTicket.mockResolvedValue(ticket);
      await expect(useCase.submitFeedback('t-1', 'cust-1', 5)).rejects.toBeInstanceOf(SupportValidationError);
    });

    it('should reject out-of-range satisfaction', async () => {
      support.getTicket.mockResolvedValue({ ...ticket, status: 'resolved' });
      await expect(useCase.submitFeedback('t-1', 'cust-1', 6)).rejects.toBeInstanceOf(SupportValidationError);
      expect(support.submitFeedback).not.toHaveBeenCalled();
    });

    it('should submit feedback on a resolved ticket', async () => {
      support.getTicket.mockResolvedValue({ ...ticket, status: 'resolved' });
      await useCase.submitFeedback('t-1', 'cust-1', 5, 'great');
      expect(support.submitFeedback).toHaveBeenCalledWith('t-1', 5, 'great');
    });
  });

  describe('addAgentMessage', () => {
    it('should enrich the message with the agent identity', async () => {
      support.getAgent.mockResolvedValue({ firstName: 'Bob', lastName: 'Smith', email: 'bob@support.io' });
      support.addMessage.mockResolvedValue(message);

      await useCase.addAgentMessage('t-1', 'agent-1', { message: 'reply', isInternal: true });

      expect(support.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ senderType: 'agent', senderName: 'Bob Smith', senderEmail: 'bob@support.io', isInternal: true }),
      );
    });

    it('should post even when the agent record is missing', async () => {
      support.getAgent.mockResolvedValue(null);
      support.addMessage.mockResolvedValue(message);

      await useCase.addAgentMessage('t-1', 'agent-x', { message: 'reply' });

      expect(support.addMessage).toHaveBeenCalledWith(expect.objectContaining({ senderId: 'agent-x' }));
    });
  });
});
