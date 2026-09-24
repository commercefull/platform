import { createAdminGdprRepository } from '../../tests/testUtils';
import { ManageAdminGdprUseCase } from './ManageAdminGdpr';

describe('ManageAdminGdprUseCase', () => {
  it('should return request statistics when asked', async () => {
    const repository = createAdminGdprRepository();

    const result = await new ManageAdminGdprUseCase(repository).getGdprStats();

    expect(result.pendingRequests).toBe(10);
  });

  it('should return consent statistics when asked', async () => {
    const repository = createAdminGdprRepository();

    const result = await new ManageAdminGdprUseCase(repository).getConsentStats();

    expect(result.marketingConsent).toBe(50);
  });

  it('should list recent requests when a limit is given', async () => {
    const repository = createAdminGdprRepository();

    const result = await new ManageAdminGdprUseCase(repository).findRecentRequests(5);

    expect(result).toHaveLength(1);
    expect(repository.findRecentRequests).toHaveBeenCalledWith(5);
  });

  it('should resolve the customer id when an email is given', async () => {
    const repository = createAdminGdprRepository();

    const result = await new ManageAdminGdprUseCase(repository).findCustomerIdByEmail('test@test.com');

    expect(result).toBe('customer-1');
    expect(repository.findCustomerIdByEmail).toHaveBeenCalledWith('test@test.com');
  });

  it('should create the request through the repository', async () => {
    const repository = createAdminGdprRepository();
    const params = { requestType: 'access', customerEmail: 'a@b.com', dueDate: new Date('2026-02-01') };

    await new ManageAdminGdprUseCase(repository).createRequest(params);

    expect(repository.createRequest).toHaveBeenCalledWith(params);
  });

  it('should complete the request when an id is given', async () => {
    const repository = createAdminGdprRepository();

    await new ManageAdminGdprUseCase(repository).completeRequest('r1', 'Done');

    expect(repository.completeRequest).toHaveBeenCalledWith('r1', 'Done');
  });

  it('should look up a request by id when asked', async () => {
    const repository = createAdminGdprRepository();

    const result = await new ManageAdminGdprUseCase(repository).findRequestById('r1');

    expect(result).toEqual({ requestId: 'r1' });
    expect(repository.findRequestById).toHaveBeenCalledWith('r1');
  });

  it('should update the request status through the repository', async () => {
    const repository = createAdminGdprRepository();

    await new ManageAdminGdprUseCase(repository).updateStatus('r1', 'processing');

    expect(repository.updateStatus).toHaveBeenCalledWith('r1', 'processing');
  });
});

