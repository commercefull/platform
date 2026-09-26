import { ApproveOrganizationUseCase } from './ApproveOrganization';
import type { OrganizationRepository } from '../../domain/repositories/OrganizationRepository';
import { eventBus } from '../../../../libs/events/eventBus';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

const emitMock = jest.mocked(eventBus.emit);

describe('ApproveOrganizationUseCase', () => {
  it('should mark the organization approved and emit organization.approved', async () => {
    const repository: Pick<OrganizationRepository, 'update'> = {
      update: jest.fn().mockResolvedValue({ organizationId: 'org-1', name: 'Acme Corp' }),
    };
    const useCase = new ApproveOrganizationUseCase(repository);

    const result = await useCase.execute('org-1');

    expect(repository.update).toHaveBeenCalledWith('org-1', { status: 'approved' });
    expect(emitMock).toHaveBeenCalledWith('organization.approved', {
      organizationId: 'org-1',
      businessName: 'Acme Corp',
    });
    expect(result).toEqual({ organizationId: 'org-1', name: 'Acme Corp' });
  });
});
