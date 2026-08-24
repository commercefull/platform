import identityDataRepository from '../../infrastructure/repositories/IdentityDataRepository';

const identityRepo = identityDataRepository.users;
import dashboardQueryRepository from '../../../analytics/infrastructure/repositories/DashboardQueryRepository';

export class AdminAuthUseCase {
  async findByEmail(email: string) {
    return identityRepo.findAdminByEmail(email);
  }
  async updateLastLogin(adminId: string) {
    return identityRepo.updateAdminLastLogin(adminId);
  }
  async findStoreAssignmentsByUserId(userId: string) {
    return identityRepo.findStoreUsersByUserId(userId);
  }
}

export class GetDashboardDataUseCase {
  async getAdminDashboardStats() {
    return dashboardQueryRepository.getAdminDashboardStats();
  }
  async getRecentOrders(limit: number) {
    return dashboardQueryRepository.getRecentOrders(limit);
  }
  async getTopProducts(limit: number) {
    return dashboardQueryRepository.getTopProducts(limit);
  }
  async getRevenueByDay(days: number) {
    return dashboardQueryRepository.getRevenueByDay(days);
  }
}
