import { createTicketRepository } from '../../tests/testUtils';
import { CreateTicketUseCase } from './CreateTicket';
import { SupportValidationError } from '../../domain/errors/SupportErrors';

describe('CreateTicketUseCase', () => {
  let useCase: CreateTicketUseCase;
  let supportRepository: ReturnType<typeof createTicketRepository>;

  beforeEach(() => {
    supportRepository = createTicketRepository();
    supportRepository.createTicket.mockImplementation(async data => ({
      ticketId: data.ticketId,
      ticketNumber: data.ticketNumber,
      subject: data.subject,
      type: data.type,
      priority: data.priority,
      status: data.status,
      createdAt: new Date(),
    }));
    useCase = new CreateTicketUseCase(supportRepository);
  });

  it('should persist and return an open ticket when the input is valid', async () => {
    const result = await useCase.execute({
      customerId: 'cust-1',
      subject: 'Help needed',
      description: 'I need help',
      type: 'question',
    });

    expect(result.status).toBe('open');
    expect(result.priority).toBe('medium');
    expect(supportRepository.createTicket).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1', subject: 'Help needed', status: 'open', attachments: [], tags: [] }),
    );
  });

  it.each(['return_request', 'refund_request'] as const)(
    'should force high priority when the ticket is a %s',
    async type => {
      const result = await useCase.execute({ customerId: 'cust-1', subject: 'S', description: 'D', type, priority: 'low' });

      expect(result.priority).toBe('high');
      expect(supportRepository.createTicket).toHaveBeenCalledWith(expect.objectContaining({ priority: 'high' }));
    },
  );

  it('should keep the requested priority when the type has no auto-priority', async () => {
    const result = await useCase.execute({
      customerId: 'cust-1',
      subject: 'S',
      description: 'D',
      type: 'question',
      priority: 'urgent',
    });

    expect(result.priority).toBe('urgent');
  });

  it('should throw SupportValidationError when required fields are missing', async () => {
    await expect(useCase.execute({ customerId: '', subject: 'S', description: 'D', type: 'question' })).rejects.toThrow(
      SupportValidationError,
    );
    await expect(useCase.execute({ customerId: 'c1', subject: '', description: 'D', type: 'question' })).rejects.toThrow(
      SupportValidationError,
    );
    await expect(useCase.execute({ customerId: 'c1', subject: 'S', description: '', type: 'question' })).rejects.toThrow(
      SupportValidationError,
    );
    expect(supportRepository.createTicket).not.toHaveBeenCalled();
  });
});
