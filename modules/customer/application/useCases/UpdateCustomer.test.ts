/**
 * Unit Tests for UpdateCustomer Use Case
 */

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UpdateCustomerUseCase, UpdateCustomerCommand } from './UpdateCustomer';
import { CustomerNotFoundError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('UpdateCustomerUseCase', () => {
  let useCase: UpdateCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    useCase = new UpdateCustomerUseCase(mockRepo as never as ConstructorParameters<typeof UpdateCustomerUseCase>[0]);
    jest.mocked(eventBus.emit).mockClear();
  });

  function createCustomerRecord() {
    return {
      customerId: 'cust-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      dateOfBirth: null,
      timezone: 'en',
      taxExempt: false,
      note: null,
      tags: [],
      updatedAt: new Date('2024-01-01'),
    };
  }

  it('should update firstName and lastName', async () => {
    mockRepo.findById.mockResolvedValue(createCustomerRecord());
    mockRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute(
      new UpdateCustomerCommand('cust-1', { firstName: 'Jane', lastName: 'Smith' }),
    );

    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
    expect(result.updatedFields).toContain('firstName');
    expect(result.updatedFields).toContain('lastName');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(eventBus.emit).toHaveBeenCalledWith('customer.updated', expect.objectContaining({
      customerId: 'cust-1',
      updatedFields: expect.arrayContaining(['firstName', 'lastName']),
    }));
  });

  it('should update phone', async () => {
    mockRepo.findById.mockResolvedValue(createCustomerRecord());

    const result = await useCase.execute(
      new UpdateCustomerCommand('cust-1', { phone: '555-9999' }),
    );

    expect(result.updatedFields).toContain('phone');
  });

  it('should update preferredLanguage', async () => {
    mockRepo.findById.mockResolvedValue(createCustomerRecord());

    const result = await useCase.execute(
      new UpdateCustomerCommand('cust-1', { preferredLanguage: 'fr' }),
    );

    expect(result.updatedFields).toContain('preferredLanguage');
  });

  it('should update notes', async () => {
    mockRepo.findById.mockResolvedValue(createCustomerRecord());

    const result = await useCase.execute(
      new UpdateCustomerCommand('cust-1', { notes: 'VIP customer' }),
    );

    expect(result.updatedFields).toContain('notes');
  });

  it('should throw CustomerNotFoundError when customer does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(new UpdateCustomerCommand('cust-x', { firstName: 'Jane' })),
    ).rejects.toThrow(CustomerNotFoundError);
  });

  it('should trim firstName and lastName', async () => {
    const customer = createCustomerRecord();
    mockRepo.findById.mockResolvedValue(customer);
    mockRepo.save.mockImplementation(async (c: unknown) => c);

    await useCase.execute(
      new UpdateCustomerCommand('cust-1', { firstName: '  Jane  ', lastName: '  Smith  ' }),
    );

    expect(customer.firstName).toBe('Jane');
    expect(customer.lastName).toBe('Smith');
  });
});
