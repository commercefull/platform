import { createSupportAdminPort, createTicketRecord } from '../../tests/testUtils';
import { ManageSupportTicketsUseCase } from './ManageSupportTickets';

describe('ManageSupportTicketsUseCase', () => {
  let useCase: ManageSupportTicketsUseCase;
  let adminRepo: ReturnType<typeof createSupportAdminPort>;

  beforeEach(() => {
    adminRepo = createSupportAdminPort();
    useCase = new ManageSupportTicketsUseCase(adminRepo);
  });

  it('should return support stats from the admin repository', async () => {
    adminRepo.getSupportStats.mockResolvedValue({ openTickets: 3, resolvedToday: 7, avgResponseTime: 12 });

    const result = await useCase.getSupportStats();

    expect(result).toEqual({ openTickets: 3, resolvedToday: 7, avgResponseTime: 12 });
  });

  it('should list recent tickets with the requested limit', async () => {
    adminRepo.listRecentTickets.mockResolvedValue([createTicketRecord()]);

    const result = await useCase.listRecentTickets(5);

    expect(adminRepo.listRecentTickets).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(1);
  });

  it('should list tickets with the given filters', async () => {
    const filters = { status: 'open', limit: 10 };
    adminRepo.listTickets.mockResolvedValue([createTicketRecord()]);

    const result = await useCase.listTickets(filters);

    expect(adminRepo.listTickets).toHaveBeenCalledWith(filters);
    expect(result).toHaveLength(1);
  });

  it('should return the ticket when it exists', async () => {
    adminRepo.findTicketById.mockResolvedValue(createTicketRecord());

    const result = await useCase.findTicketById('tkt-1');

    expect(result?.supportTicketId).toBe('tkt-1');
  });

  it('should update the ticket status', async () => {
    await useCase.updateTicketStatus('tkt-1', 'closed');

    expect(adminRepo.updateTicketStatus).toHaveBeenCalledWith('tkt-1', 'closed');
  });

  it('should add a ticket message as the given user', async () => {
    await useCase.addTicketMessage('tkt-1', 'Following up', 'user-1');

    expect(adminRepo.addTicketMessage).toHaveBeenCalledWith('tkt-1', 'Following up', 'user-1');
  });
});

