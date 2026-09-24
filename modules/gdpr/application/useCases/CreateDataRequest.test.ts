import { createDataRequest, createGdprDataRequestRepository, emitMock } from '../../tests/testUtils';
import { CreateDataRequestUseCase, CreateDataRequestCommand } from './CreateDataRequest';
import { CustomerIdRequiredError, GdprValidationError } from '../../domain/errors/GdprErrors';

describe('CreateDataRequestUseCase', () => {
  it('should create the data request when the command is valid', async () => {
    const repository = createGdprDataRequestRepository();

    const result = await new CreateDataRequestUseCase(repository).execute(
      new CreateDataRequestCommand('customer-1', 'access', 'Want my data'),
    );

    expect(result.gdprDataRequestId).toBe('test-uuid');
    expect(result.requestType).toBe('access');
    expect(result.status).toBe('pending');
    expect(new Date(result.deadlineAt).getTime()).toBeGreaterThan(Date.now());
    expect(repository.save).toHaveBeenCalled();
  });

  it('should emit gdpr.request.created when the request is created', async () => {
    await new CreateDataRequestUseCase(createGdprDataRequestRepository()).execute(
      new CreateDataRequestCommand('customer-1', 'deletion'),
    );

    expect(emitMock).toHaveBeenCalledWith(
      'gdpr.request.created',
      expect.objectContaining({ gdprDataRequestId: 'test-uuid', customerId: 'customer-1', requestType: 'deletion' }),
    );
  });

  it('should throw CustomerIdRequiredError when the customer id is blank', async () => {
    const repository = createGdprDataRequestRepository();

    await expect(
      new CreateDataRequestUseCase(repository).execute(new CreateDataRequestCommand('   ', 'access')),
    ).rejects.toThrow(CustomerIdRequiredError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw GdprValidationError when a pending request of the same type exists', async () => {
    const repository = createGdprDataRequestRepository();
    repository.findByCustomerId.mockResolvedValue([createDataRequest({ requestType: 'access', status: 'pending' })]);

    await expect(
      new CreateDataRequestUseCase(repository).execute(new CreateDataRequestCommand('customer-1', 'access')),
    ).rejects.toThrow(GdprValidationError);
    expect(repository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should allow the request when only a different type is pending', async () => {
    const repository = createGdprDataRequestRepository();
    repository.findByCustomerId.mockResolvedValue([createDataRequest({ requestType: 'deletion', status: 'pending' })]);

    const result = await new CreateDataRequestUseCase(repository).execute(
      new CreateDataRequestCommand('customer-1', 'access'),
    );

    expect(result.status).toBe('pending');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should allow the request when a same-type request is already completed', async () => {
    const repository = createGdprDataRequestRepository();
    repository.findByCustomerId.mockResolvedValue([createDataRequest({ requestType: 'access', status: 'completed' })]);

    const result = await new CreateDataRequestUseCase(repository).execute(
      new CreateDataRequestCommand('customer-1', 'access'),
    );

    expect(result.status).toBe('pending');
  });

  it('should throw GdprValidationError when the request type is missing', async () => {
    const repository = createGdprDataRequestRepository();

    await expect(
      new CreateDataRequestUseCase(repository).execute(
        new CreateDataRequestCommand('customer-1', undefined as unknown as 'access'),
      ),
    ).rejects.toThrow(GdprValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should block a same-type request that is still processing', async () => {
    const repository = createGdprDataRequestRepository();
    repository.findByCustomerId.mockResolvedValue([createDataRequest({ requestType: 'access', status: 'processing' })]);

    await expect(
      new CreateDataRequestUseCase(repository).execute(new CreateDataRequestCommand('customer-1', 'access')),
    ).rejects.toThrow(GdprValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
