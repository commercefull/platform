import type { AdminUserManagementPort } from '../../domain/repositories/AdminIdentityPorts';

export class ManageRolesUseCase {
  constructor(private readonly identityRepo: AdminUserManagementPort) {}

  async listRoles() {
    return this.identityRepo.listRoles();
  }
  async findById(roleId: string) {
    return this.identityRepo.findRoleById(roleId);
  }
  async create(params: { name: string; description?: string; permissions: string[] }) {
    return this.identityRepo.createRole(params);
  }
  async update(roleId: string, updates: { name?: string; description?: string; permissions?: string[] }) {
    return this.identityRepo.updateRole(roleId, updates);
  }
  async delete(roleId: string) {
    return this.identityRepo.deleteRole(roleId);
  }
  async countAssignments(roleId: string) {
    return this.identityRepo.countRoleAssignments(roleId);
  }
}
