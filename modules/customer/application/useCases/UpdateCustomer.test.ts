import '../../tests/testUtils';
import { UpdateCustomerUseCase, UpdateCustomerCommand } from './UpdateCustomer';
import { CustomerNotFoundError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, emitMock } from '../../tests/testUtils';

describe('UpdateCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new UpdateCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findById.mockResolvedValue(createCustomerRow());
    customerRepository.save.mockImplementation(async c => c);
  });

  it('should update firstName and lastName and emit customer.updated', async () => {
    const result = await useCase.execute(
      new UpdateCustomerCommand('cust-1', { firstName: 'Janet', lastName: 'Smith' }),
    );

    expect(result.firstName).toBe('Janet');
    expect(result.lastName).toBe('Smith');
    expect(result.updatedFields).toEqual(expect.arrayContaining(['firstName', 'lastName']));
    expect(customerRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Janet', lastName: 'Smith' }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'customer.updated',
      expect.objectContaining({ customerId: 'cust-1' }),
    );
  });

  it('should update the phone field', async () => {
    const result = await useCase.execute(new UpdateCustomerCommand('cust-1', { phone: '+15551234' }));

    expect(result.updatedFields).toContain('phone');
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ phone: '+15551234' }));
  });

  it('should update preferredLanguage into timezone', async () => {
    const result = await useCase.execute(new UpdateCustomerCommand('cust-1', { preferredLanguage: 'de' }));

    expect(result.updatedFields).toContain('preferredLanguage');
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ timezone: 'de' }));
  });

  it('should update notes', async () => {
    const result = await useCase.execute(new UpdateCustomerCommand('cust-1', { notes: 'VIP customer' }));

    expect(result.updatedFields).toContain('notes');
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ note: 'VIP customer' }));
  });

  it('should throw CustomerNotFoundError when the customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateCustomerCommand('missing', { firstName: 'X' }))).rejects.toThrow(
      CustomerNotFoundError,
    );
    expect(customerRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should trim firstName and lastName', async () => {
    await useCase.execute(new UpdateCustomerCommand('cust-1', { firstName: '  Janet  ', lastName: ' Smith ' }));

    expect(customerRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Janet', lastName: 'Smith' }),
    );
  });
});
