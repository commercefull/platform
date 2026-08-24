import { CreateTicketUseCase } from './CreateTicket';
import { SupportValidationError } from '../../domain/errors/SupportErrors';

describe('CreateTicketUseCase', () => {
  let useCase: CreateTicketUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createTicket: jest.fn().mockResolvedValue({
        ticketId: 'tkt-1', ticketNumber: 'TKT-12345678', subject: 'Help',
        type: 'question', priority: 'medium', status: 'open', createdAt: new Date(),
      }),
    };
    useCase = new CreateTicketUseCase(mockRepo as never);
  });

  it('should create a ticket successfully (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'cust-1', subject: 'Help needed', description: 'I need help', type: 'question' });

    expect(result.ticketId).toBe('tkt-1');
    expect(result.status).toBe('open');
    expect(result.priority).toBe('medium');
  });

  it('should auto-set high priority for return requests', async () => {
    mockRepo.createTicket.mockResolvedValue({
      ticketId: 'tkt-2', ticketNumber: 'TKT-12345679', subject: 'Return',
      type: 'return_request', priority: 'high', status: 'open', createdAt: new Date(),
    });

    const result = await useCase.execute({ customerId: 'cust-1', subject: 'Return', description: 'Want return', type: 'return_request' });

    expect(result.priority).toBe('high');
  });

  it('should auto-set high priority for refund requests', async () => {
    mockRepo.createTicket.mockResolvedValue({
      ticketId: 'tkt-3', ticketNumber: 'TKT-12345680', subject: 'Refund',
      type: 'refund_request', priority: 'high', status: 'open', createdAt: new Date(),
    });

    const result = await useCase.execute({ customerId: 'cust-1', subject: 'Refund', description: 'Want refund', type: 'refund_request' });

    expect(result.priority).toBe('high');
  });

  it('should throw SupportValidationError when required fields missing', async () => {
    await expect(useCase.execute({ customerId: '', subject: 'S', description: 'D', type: 'question' })).rejects.toThrow(SupportValidationError);
    await expect(useCase.execute({ customerId: 'c1', subject: '', description: 'D', type: 'question' })).rejects.toThrow(SupportValidationError);
    await expect(useCase.execute({ customerId: 'c1', subject: 'S', description: '', type: 'question' })).rejects.toThrow(SupportValidationError);
  });
});
