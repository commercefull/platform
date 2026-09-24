import { createUpdateTicketRepository } from '../../tests/testUtils';
import { UpdateTicketUseCase } from './UpdateTicket';
import { SupportTicketNotFoundError } from '../../domain/errors/SupportErrors';

describe('UpdateTicketUseCase', () => {
  let useCase: UpdateTicketUseCase;
  let supportRepository: ReturnType<typeof createUpdateTicketRepository>;

  const existingTicket = { ticketId: 'tkt-1', status: 'open', priority: 'medium', updatedAt: new Date() };

  beforeEach(() => {
    supportRepository = createUpdateTicketRepository();
    supportRepository.findTicketById.mockResolvedValue(existingTicket);
    supportRepository.updateTicket.mockImplementation(async (ticketId, data) => ({
      ticketId,
      status: (data.status as string) ?? 'open',
      priority: (data.priority as string) ?? 'medium',
      assignedTo: data.assignedTo as string | undefined,
      updatedAt: new Date(),
    }));
    useCase = new UpdateTicketUseCase(supportRepository);
  });

  it('should apply the requested updates when the ticket exists', async () => {
    const result = await useCase.execute({ ticketId: 'tkt-1', status: 'in_progress', priority: 'high', updatedBy: 'agent-1' });

    expect(result.status).toBe('in_progress');
    expect(result.priority).toBe('high');
    expect(supportRepository.updateTicket).toHaveBeenCalledWith(
      'tkt-1',
      expect.objectContaining({ status: 'in_progress', priority: 'high', updatedBy: 'agent-1' }),
    );
  });

  it('should throw SupportTicketNotFoundError when the ticket does not exist', async () => {
    supportRepository.findTicketById.mockResolvedValue(null);

    await expect(useCase.execute({ ticketId: 'missing', updatedBy: 'agent-1' })).rejects.toThrow(SupportTicketNotFoundError);
    expect(supportRepository.updateTicket).not.toHaveBeenCalled();
  });

  it('should set resolvedAt when the status transitions to resolved', async () => {
    await useCase.execute({ ticketId: 'tkt-1', status: 'resolved', updatedBy: 'agent-1' });

    expect(supportRepository.updateTicket).toHaveBeenCalledWith(
      'tkt-1',
      expect.objectContaining({ resolvedAt: expect.any(Date) }),
    );
  });

  it('should set closedAt when the status transitions to closed', async () => {
    await useCase.execute({ ticketId: 'tkt-1', status: 'closed', updatedBy: 'agent-1' });

    expect(supportRepository.updateTicket).toHaveBeenCalledWith(
      'tkt-1',
      expect.objectContaining({ closedAt: expect.any(Date) }),
    );
  });

  it('should not reset resolvedAt when the ticket is already resolved', async () => {
    supportRepository.findTicketById.mockResolvedValue({ ...existingTicket, status: 'resolved' });

    await useCase.execute({ ticketId: 'tkt-1', status: 'resolved', updatedBy: 'agent-1' });

    expect(supportRepository.updateTicket).toHaveBeenCalledWith(
      'tkt-1',
      expect.not.objectContaining({ resolvedAt: expect.any(Date) }),
    );
  });
});
