import { UpdateTicketUseCase } from './UpdateTicket';
import { SupportTicketNotFoundError } from '../../domain/errors/SupportErrors';

describe('UpdateTicketUseCase', () => {
  let useCase: UpdateTicketUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findTicketById: jest.fn().mockResolvedValue({ ticketId: 'tkt-1', status: 'open', priority: 'medium', updatedAt: new Date() }),
      updateTicket: jest.fn().mockResolvedValue({ ticketId: 'tkt-1', status: 'in_progress', priority: 'high', updatedAt: new Date() }),
    };
    useCase = new UpdateTicketUseCase(mockRepo as never);
  });

  it('should update ticket status and priority (happy path)', async () => {
    const result = await useCase.execute({ ticketId: 'tkt-1', status: 'in_progress', priority: 'high', updatedBy: 'agent-1' });

    expect(result.status).toBe('in_progress');
    expect(result.priority).toBe('high');
  });

  it('should throw SupportTicketNotFoundError when ticket does not exist', async () => {
    mockRepo.findTicketById.mockResolvedValue(null);

    await expect(useCase.execute({ ticketId: 'missing', updatedBy: 'agent-1' })).rejects.toThrow(SupportTicketNotFoundError);
  });

  it('should set resolvedAt when status changes to resolved', async () => {
    await useCase.execute({ ticketId: 'tkt-1', status: 'resolved', updatedBy: 'agent-1' });

    expect(mockRepo.updateTicket).toHaveBeenCalledWith('tkt-1', expect.objectContaining({ resolvedAt: expect.any(Date), updatedBy: 'agent-1' }));
  });

  it('should set closedAt when status changes to closed', async () => {
    await useCase.execute({ ticketId: 'tkt-1', status: 'closed', updatedBy: 'agent-1' });

    expect(mockRepo.updateTicket).toHaveBeenCalledWith('tkt-1', expect.objectContaining({ closedAt: expect.any(Date) }));
  });

  it('should not set resolvedAt when already resolved', async () => {
    mockRepo.findTicketById.mockResolvedValue({ ticketId: 'tkt-1', status: 'resolved', priority: 'medium', updatedAt: new Date() });

    await useCase.execute({ ticketId: 'tkt-1', status: 'resolved', updatedBy: 'agent-1' });

    expect(mockRepo.updateTicket).toHaveBeenCalledWith('tkt-1', expect.not.objectContaining({ resolvedAt: expect.any(Date) }));
  });
});
