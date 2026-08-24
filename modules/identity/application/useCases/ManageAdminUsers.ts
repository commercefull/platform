import identityDataRepository from '../../infrastructure/repositories/IdentityDataRepository';

const identityRepo = identityDataRepository.users;

export class ManageAdminUsersUseCase {
  async listUsers(filters: { status?: string; limit?: number; offset?: number }) {
    return identityRepo.listManagedAdminUsers(filters);
  }
  async findById(userId: string) {
    return identityRepo.findManagedAdminUserById(userId);
  }
  async findByEmail(email: string) {
    return identityRepo.findManagedAdminUserByEmail(email);
  }
  async create(params: { email: string; passwordHash: string; firstName?: string; lastName?: string; roleId?: string }) {
    return identityRepo.createManagedAdminUser(params);
  }
  async update(userId: string, updates: { firstName?: string; lastName?: string; status?: string; roleId?: string }) {
    return identityRepo.updateManagedAdminUser(userId, updates);
  }
  async delete(userId: string) {
    return identityRepo.deleteManagedAdminUser(userId);
  }
}

export class ManageRolesUseCase {
  async listRoles() {
    return identityRepo.listRoles();
  }
  async findById(roleId: string) {
    return identityRepo.findRoleById(roleId);
  }
  async create(params: { name: string; description?: string; permissions: string[] }) {
    return identityRepo.createRole(params);
  }
  async update(roleId: string, updates: { name?: string; description?: string; permissions?: string[] }) {
    return identityRepo.updateRole(roleId, updates);
  }
  async delete(roleId: string) {
    return identityRepo.deleteRole(roleId);
  }
  async countAssignments(roleId: string) {
    return identityRepo.countRoleAssignments(roleId);
  }
}
