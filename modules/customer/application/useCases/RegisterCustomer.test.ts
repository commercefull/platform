/**
 * Unit Tests for RegisterCustomer Use Case
 */

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn(() => 'test-uuid-123'),
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import { RegisterCustomerUseCase, RegisterCustomerCommand } from './RegisterCustomer';
import {
  EmailRequiredError,
  CustomerEmailAlreadyExistsError,
  CustomerValidationError,
} from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';
import { generateUUID } from '../../../../libs/uuid';

describe('RegisterCustomerUseCase', () => {
  let useCase: RegisterCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RegisterCustomerUseCase(mockRepo as never as ConstructorParameters<typeof RegisterCustomerUseCase>[0]);
    jest.mocked(eventBus.emit).mockClear();
    jest.mocked(generateUUID).mockReturnValue('test-uuid-123');
  });

  function createCommand(overrides?: Partial<{ email: string; firstName: string; lastName: string; password: string; phone: string }>): RegisterCustomerCommand {
    return new RegisterCustomerCommand(
      overrides?.email ?? 'john@example.com',
      overrides?.firstName ?? 'John',
      overrides?.lastName ?? 'Doe',
      overrides?.password ?? 'securePassword123',
      overrides?.phone,
    );
  }

  it('should register a new customer successfully', async () => {
    const result = await useCase.execute(createCommand());

    expect(result.customerId).toBe('test-uuid-123');
    expect(result.email).toBe('john@example.com');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.isVerified).toBe(false);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.updatePassword).toHaveBeenCalledWith('test-uuid-123', 'hashed-password');
    expect(eventBus.emit).toHaveBeenCalledWith('customer.registered', expect.objectContaining({
      customerId: 'test-uuid-123',
      email: 'john@example.com',
    }));
  });

  it('should throw EmailRequiredError when email is empty', async () => {
    await expect(useCase.execute(createCommand({ email: '  ' }))).rejects.toThrow(EmailRequiredError);
  });

  it('should throw CustomerValidationError when firstName is empty', async () => {
    await expect(useCase.execute(createCommand({ firstName: '  ' }))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerValidationError when lastName is empty', async () => {
    await expect(useCase.execute(createCommand({ lastName: '  ' }))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerValidationError when password is too short', async () => {
    await expect(useCase.execute(createCommand({ password: 'short' }))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerEmailAlreadyExistsError when email is taken', async () => {
    mockRepo.findByEmail.mockResolvedValue({ customerId: 'existing-1' });

    await expect(useCase.execute(createCommand())).rejects.toThrow(CustomerEmailAlreadyExistsError);
  });

  it('should normalize email to lowercase', async () => {
    const result = await useCase.execute(createCommand({ email: '  JOHN@EXAMPLE.COM  ' }));

    expect(result.email).toBe('john@example.com');
  });
});
