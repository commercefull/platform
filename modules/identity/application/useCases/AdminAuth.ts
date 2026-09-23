import type { AdminAuthPort, AdminUser } from '../../domain/repositories/AdminIdentityPorts';
import type { UserStoreAssignment } from '../../domain/entities/UserStoreAssignment';

export class AdminAuthUseCase {
  constructor(private readonly identityRepo: AdminAuthPort) {}

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.identityRepo.findAdminByEmail(email);
  }
  async updateLastLogin(adminId: string) {
    return this.identityRepo.updateAdminLastLogin(adminId);
  }
  async findStoreAssignmentsByUserId(userId: string): Promise<UserStoreAssignment[]> {
    return this.identityRepo.findStoreUsersByUserId(userId);
  }
}

