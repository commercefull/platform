jest.mock('../../infrastructure/repositories/GdprDataRepository', () => ({
  __esModule: true,
  default: {
    admin: {
      getGdprStats: jest.fn().mockResolvedValue({ totalRequests: 10 }),
      getConsentStats: jest.fn().mockResolvedValue({ totalConsents: 50 }),
      findRecentRequests: jest.fn().mockResolvedValue([{ requestId: 'r1' }]),
      findRequestById: jest.fn().mockResolvedValue({ requestId: 'r1' }),
      findCustomerIdByEmail: jest.fn().mockResolvedValue('c1'),
      createRequest: jest.fn().mockResolvedValue({ requestId: 'r2' }),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      completeRequest: jest.fn().mockResolvedValue(undefined),
    },
    dataRequests: {
      findById: jest.fn().mockResolvedValue({ requestId: 'r1' }),
      findByCustomerId: jest.fn().mockResolvedValue([{ requestId: 'r1' }]),
      findAll: jest.fn().mockResolvedValue({ data: [{ requestId: 'r1' }], total: 1 }),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

import { ManageAdminGdprUseCase, ManageGdprRequestsUseCase } from './ManageGdpr';
import gdprDataRepository from '../../infrastructure/repositories/GdprDataRepository';

const mockAdmin = gdprDataRepository as unknown as { admin: Record<string, jest.Mock> };
const mockRequests = gdprDataRepository as unknown as { dataRequests: Record<string, jest.Mock> };

describe('ManageAdminGdprUseCase', () => {
  let useCase: ManageAdminGdprUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageAdminGdprUseCase();
  });

  it('should get gdpr stats', async () => {
    const result = await useCase.getGdprStats() as unknown as Record<string, unknown>;
    expect(result.totalRequests).toBe(10);
  });

  it('should get consent stats', async () => {
    const result = await useCase.getConsentStats() as unknown as Record<string, unknown>;
    expect(result.totalConsents).toBe(50);
  });

  it('should find recent requests', async () => {
    const result = await useCase.findRecentRequests(5);
    expect(result).toHaveLength(1);
  });

  it('should find customer by email', async () => {
    const result = await useCase.findCustomerIdByEmail('test@test.com');
    expect(result).toBe('c1');
  });

  it('should create request', async () => {
    const result = await useCase.createRequest({ type: 'access', customerId: 'c1' } as never);
    expect(result).toEqual({ requestId: 'r2' });
  });

  it('should complete request', async () => {
    await useCase.completeRequest('r1', 'Done');
    expect(mockAdmin.admin.completeRequest).toHaveBeenCalledWith('r1', 'Done');
  });
});

describe('ManageGdprRequestsUseCase', () => {
  let useCase: ManageGdprRequestsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageGdprRequestsUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('r1');
    expect(result).toEqual({ requestId: 'r1' });
  });

  it('should find by customer ID', async () => {
    const result = await useCase.findByCustomerId('c1');
    expect(result).toHaveLength(1);
  });

  it('should save request', async () => {
    await useCase.save({ requestId: 'r1' } as never);
    expect(mockRequests.dataRequests.save).toHaveBeenCalled();
  });
});
