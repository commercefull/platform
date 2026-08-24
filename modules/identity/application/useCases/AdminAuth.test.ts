jest.mock('../../infrastructure/repositories/IdentityDataRepository', () => ({
  __esModule: true,
  default: {
    users: {
      findAdminByEmail: jest.fn().mockResolvedValue({ adminId: 'a1', email: 'admin@test.com' }),
      updateAdminLastLogin: jest.fn().mockResolvedValue(undefined),
      findStoreUsersByUserId: jest.fn().mockResolvedValue([{ storeId: 's1', role: 'admin' }]),
    },
  },
}));

jest.mock('../../../analytics/infrastructure/repositories/DashboardQueryRepository', () => ({
  __esModule: true,
  default: {
    getAdminDashboardStats: jest.fn().mockResolvedValue({ totalOrders: 100, totalRevenue: 5000 }),
    getRecentOrders: jest.fn().mockResolvedValue([{ orderId: 'o1' }]),
    getTopProducts: jest.fn().mockResolvedValue([{ productId: 'p1' }]),
    getRevenueByDay: jest.fn().mockResolvedValue([{ date: '2024-01-01', revenue: 500 }]),
  },
}));

import { AdminAuthUseCase, GetDashboardDataUseCase } from './AdminAuth';
import identityDataRepository from '../../infrastructure/repositories/IdentityDataRepository';
import dashboardQueryRepository from '../../../analytics/infrastructure/repositories/DashboardQueryRepository';

const mockIdentityRepo = identityDataRepository as unknown as { users: Record<string, jest.Mock> };
const mockDashboardRepo = dashboardQueryRepository as unknown as Record<string, jest.Mock>;

describe('AdminAuthUseCase', () => {
  let useCase: AdminAuthUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AdminAuthUseCase();
  });

  it('should find by email', async () => {
    const result = await useCase.findByEmail('admin@test.com');
    expect(result).toEqual({ adminId: 'a1', email: 'admin@test.com' });
  });

  it('should update last login', async () => {
    await useCase.updateLastLogin('a1');
    expect(mockIdentityRepo.users.updateAdminLastLogin).toHaveBeenCalledWith('a1');
  });

  it('should find store assignments', async () => {
    const result = await useCase.findStoreAssignmentsByUserId('u1');
    expect(result).toHaveLength(1);
  });
});

describe('GetDashboardDataUseCase', () => {
  let useCase: GetDashboardDataUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetDashboardDataUseCase();
  });

  it('should get admin dashboard stats', async () => {
    const result = await useCase.getAdminDashboardStats();
    expect(result.totalOrders).toBe(100);
  });

  it('should get recent orders', async () => {
    const result = await useCase.getRecentOrders(5);
    expect(result).toHaveLength(1);
    expect(mockDashboardRepo.getRecentOrders).toHaveBeenCalledWith(5);
  });

  it('should get revenue by day', async () => {
    const result = await useCase.getRevenueByDay(30);
    expect(result).toHaveLength(1);
  });
});
