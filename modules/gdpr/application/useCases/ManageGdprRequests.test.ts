import { createDataRequest, createGdprDataRequestRepository } from '../../tests/testUtils';
import { ManageGdprRequestsUseCase } from './ManageGdprRequests';

describe('ManageGdprRequestsUseCase', () => {
  it('should return the request when looking it up by id', async () => {
    const request = createDataRequest();
    const repository = createGdprDataRequestRepository(request);

    const result = await new ManageGdprRequestsUseCase(repository).findById('req-1');

    expect(result).toBe(request);
    expect(repository.findById).toHaveBeenCalledWith('req-1');
  });

  it('should list requests for a customer when a customer id is given', async () => {
    const request = createDataRequest();
    const repository = createGdprDataRequestRepository(request);
    repository.findByCustomerId.mockResolvedValue([request]);

    const result = await new ManageGdprRequestsUseCase(repository).findByCustomerId('customer-1');

    expect(result).toEqual([request]);
    expect(repository.findByCustomerId).toHaveBeenCalledWith('customer-1');
  });

  it('should pass filters and pagination through when listing all requests', async () => {
    const repository = createGdprDataRequestRepository();
    const pagination = { limit: 10, offset: 5 };

    await new ManageGdprRequestsUseCase(repository).findAll({ status: 'pending' }, pagination);

    expect(repository.findAll).toHaveBeenCalledWith({ status: 'pending' }, pagination);
  });

  it('should save the request through the repository', async () => {
    const request = createDataRequest();
    const repository = createGdprDataRequestRepository(request);

    await new ManageGdprRequestsUseCase(repository).save(request);

    expect(repository.save).toHaveBeenCalledWith(request);
  });
});
