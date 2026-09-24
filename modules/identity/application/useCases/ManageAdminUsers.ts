import type { AdminUserManagementPort, CreateAdminUserParams } from '../../domain/repositories/AdminIdentityPorts';

export class ManageAdminUsersUseCase {
  constructor(private readonly identityRepo: AdminUserManagementPort) {}

  async listUsers(filters: { status?: string; limit?: number; offset?: number }) {
    return this.identityRepo.listManagedAdminUsers(filters);
  }
  async findById(userId: string) {
    return this.identityRepo.findManagedAdminUserById(userId);
  }
  async findByEmail(email: string) {
    return this.identityRepo.findManagedAdminUserByEmail(email);
  }
  async create(params: CreateAdminUserParams) {
    return this.identityRepo.createManagedAdminUser(params);
  }
  async update(userId: string, updates: { firstName?: string; lastName?: string; status?: string; roleId?: string }) {
    return this.identityRepo.updateManagedAdminUser(userId, updates);
  }
  async delete(userId: string) {
    return this.identityRepo.deleteManagedAdminUser(userId);
  }
}
