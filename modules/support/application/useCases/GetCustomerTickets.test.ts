import { createCustomerTicketsRepository } from '../../tests/testUtils';
import { GetCustomerTicketsUseCase } from './GetCustomerTickets';

describe('GetCustomerTicketsUseCase', () => {
  let useCase: GetCustomerTicketsUseCase;
  let supportRepository: ReturnType<typeof createCustomerTicketsRepository>;

  const ticket = {
    ticketId: 'tkt-1',
    ticketNumber: 'TKT-1',
    subject: 'Help',
    type: 'question',
    priority: 'medium',
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    supportRepository = createCustomerTicketsRepository();
    supportRepository.findTickets.mockResolvedValue([ticket]);
    supportRepository.countTickets.mockResolvedValue(1);
    useCase = new GetCustomerTicketsUseCase(supportRepository);
  });

  it('should return the customer tickets with pagination metadata', async () => {
    const result = await useCase.execute({ customerId: 'cust-1' });

    expect(result.tickets).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(supportRepository.findTickets).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1' }),
      expect.any(Object),
    );
  });

  it('should pass status and type filters to the repository', async () => {
    await useCase.execute({ customerId: 'cust-1', status: 'open', type: 'issue' });

    expect(supportRepository.findTickets).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1', status: 'open', type: 'issue' }),
      expect.any(Object),
    );
  });

  it('should use default pagination when none is provided', async () => {
    const result = await useCase.execute({ customerId: 'cust-1' });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(supportRepository.findTickets).toHaveBeenCalledWith(expect.anything(), { page: 1, limit: 10 });
  });
});
