import { SuspendOrganizationUseCase } from './SuspendOrganization';
import type { OrganizationRepository } from '../../domain/repositories/OrganizationRepository';
import { eventBus } from '../../../../libs/events/eventBus';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

const emitMock = jest.mocked(eventBus.emit);

describe('SuspendOrganizationUseCase', () => {
  it('should mark the organization suspended and emit organization.suspended', async () => {
    const repository: Pick<OrganizationRepository, 'update'> = {
      update: jest.fn().mockResolvedValue({ organizationId: 'org-1', name: 'Acme Corp' }),
    };
    const useCase = new SuspendOrganizationUseCase(repository);

    const result = await useCase.execute('org-1');

    expect(repository.update).toHaveBeenCalledWith('org-1', { status: 'suspended' });
    expect(emitMock).toHaveBeenCalledWith('organization.suspended', {
      organizationId: 'org-1',
      businessName: 'Acme Corp',
    });
    expect(result).toEqual({ organizationId: 'org-1', name: 'Acme Corp' });
  });
});
