/**
 * Unit Tests for ManageStorefrontSupport Use Case
 */

import { createStorefrontSupportPort, createTicketRecord } from '../../tests/testUtils';
import { ManageStorefrontSupportUseCase } from './ManageStorefrontSupport';
import type { SupportAgent } from '../../domain/repositories/SupportRepository';

describe('ManageStorefrontSupportUseCase', () => {
  let useCase: ManageStorefrontSupportUseCase;
  let supportRepo: ReturnType<typeof createStorefrontSupportPort>;

  beforeEach(() => {
    supportRepo = createStorefrontSupportPort();
    useCase = new ManageStorefrontSupportUseCase(supportRepo);
  });

  it('should return the agent when it exists', async () => {
    supportRepo.getAgent.mockResolvedValue({ supportAgentId: 'a1' } as unknown as SupportAgent);

    const result = await useCase.getAgent('a1');

    expect(result?.supportAgentId).toBe('a1');
  });

  it('should create a ticket with the given params', async () => {
    const params = { email: 'c@example.com', subject: 'Help', description: 'Need help' };
    supportRepo.createTicket.mockResolvedValue(createTicketRecord());

    const result = await useCase.createTicket(params);

    expect(supportRepo.createTicket).toHaveBeenCalledWith(params);
    expect(result.supportTicketId).toBe('tkt-1');
  });

  it('should return the ticket when it exists', async () => {
    supportRepo.getTicket.mockResolvedValue(createTicketRecord());

    const result = await useCase.getTicket('tkt-1');

    expect(result?.ticketNumber).toBe('TKT-0001');
  });

  it('should list tickets with filters and pagination', async () => {
    supportRepo.getTickets.mockResolvedValue({ data: [createTicketRecord()], total: 1 });

    const result = await useCase.getTickets({ status: 'open' }, { limit: 5 });

    expect(supportRepo.getTickets).toHaveBeenCalledWith({ status: 'open' }, { limit: 5 });
    expect(result.total).toBe(1);
  });

  it('should add a message to the ticket', async () => {
    const message = { supportTicketId: 'tkt-1', senderType: 'customer' as const, message: 'Hi' };

    await useCase.addMessage(message);

    expect(supportRepo.addMessage).toHaveBeenCalledWith(message);
  });

  it('should submit feedback for the ticket', async () => {
    await useCase.submitFeedback('tkt-1', 5, 'Great');

    expect(supportRepo.submitFeedback).toHaveBeenCalledWith('tkt-1', 5, 'Great');
  });
});
