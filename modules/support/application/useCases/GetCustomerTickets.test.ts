import { GetCustomerTicketsUseCase} from './GetCustomerTickets';

describe('GetCustomerTicketsUseCase', () => {
  let useCase: GetCustomerTicketsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findTickets: jest.fn().mockResolvedValue([
        { ticketId: 't1', ticketNumber: 'TK-001', subject: 'Help', type: 'support', priority: 'medium', status: 'open', createdAt: new Date(), commentCount: 2 },
      ]),
      countTickets: jest.fn().mockResolvedValue(1),
    };
    useCase = new GetCustomerTicketsUseCase(mockRepo as never);
  });

  it('should get customer tickets (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].ticketId).toBe('t1');
    expect(result.total).toBe(1);
    expect(result.openCount).toBe(1);
  });

  it('should apply status and type filters', async () => {
    await useCase.execute({ customerId: 'c1', status: 'open', type: 'support' });

    expect(mockRepo.findTickets).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c1', status: 'open', type: 'support' }),
      { page: 1, limit: 10 },
    );
  });

  it('should use default pagination', async () => {
    await useCase.execute({ customerId: 'c1' });

    expect(mockRepo.findTickets).toHaveBeenCalledWith(expect.any(Object), { page: 1, limit: 10 });
  });
});
