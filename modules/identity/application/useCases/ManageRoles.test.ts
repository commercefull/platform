import { lazyMock, createRoleRecord } from '../../tests/testUtils';
import { ManageRolesUseCase } from './ManageRoles';
import type { AdminUserManagementPort } from '../../domain/repositories/AdminIdentityPorts';

describe('ManageRolesUseCase', () => {
  let useCase: ManageRolesUseCase;
  let repo: jest.Mocked<AdminUserManagementPort>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<AdminUserManagementPort>();
    useCase = new ManageRolesUseCase(repo);
  });

  it('should list roles', async () => {
    repo.listRoles.mockResolvedValue([{ ...createRoleRecord(), userCount: 3 }]);

    const result = await useCase.listRoles();

    expect(result).toHaveLength(1);
  });

  it('should create a role and return its ID', async () => {
    repo.createRole.mockResolvedValue('r2');

    const result = await useCase.create({ name: 'Admin', permissions: ['read'] });

    expect(result).toBe('r2');
    expect(repo.createRole).toHaveBeenCalledWith({ name: 'Admin', permissions: ['read'] });
  });

  it('should count role assignments', async () => {
    repo.countRoleAssignments.mockResolvedValue(3);

    const result = await useCase.countAssignments('r1');

    expect(result).toBe(3);
  });
});
