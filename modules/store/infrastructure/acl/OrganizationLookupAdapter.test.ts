/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('../../../organization/infrastructure/repositories/organizationRepo', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findAll: jest.fn(),
  },
}));

import organizationRepo from '../../../organization/infrastructure/repositories/organizationRepo';
import { OrganizationLookupAdapter } from './OrganizationLookupAdapter';

describe('store/OrganizationLookupAdapter', () => {
  let adapter: OrganizationLookupAdapter;
  let mockOrgRepo: any;

  beforeEach(() => {
    mockOrgRepo = organizationRepo;
    jest.mocked(mockOrgRepo.findById).mockClear();
    jest.mocked(mockOrgRepo.findAll).mockClear();
    adapter = new OrganizationLookupAdapter();
  });

  it('implements OrganizationLookupPort', () => {
    expect(typeof adapter.findById).toBe('function');
    expect(typeof adapter.findAll).toBe('function');
  });

  it('should map organization to OrganizationSummary', async () => {
    mockOrgRepo.findById.mockResolvedValue({
      organizationId: 'org-1',
      name: 'Test Org',
      status: 'active',
    });

    const result = await adapter.findById('org-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('org-1');
    expect(result!.name).toBe('Test Org');
    expect(result!.status).toBe('active');
  });

  it('should return null when organization not found', async () => {
    mockOrgRepo.findById.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('should default status to pending when missing', async () => {
    mockOrgRepo.findById.mockResolvedValue({
      organizationId: 'org-1',
      name: 'Test Org',
      status: null,
    });

    const result = await adapter.findById('org-1');

    expect(result!.status).toBe('pending');
  });

  it('should map findAll to OrganizationSummary array', async () => {
    mockOrgRepo.findAll.mockResolvedValue([
      { organizationId: 'org-1', name: 'Org One', status: 'active' },
      { organizationId: 'org-2', name: 'Org Two', status: 'pending' },
    ]);

    const results = await adapter.findAll();

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('org-1');
    expect(results[1].id).toBe('org-2');
  });

  it('should return empty array when no organizations', async () => {
    mockOrgRepo.findAll.mockResolvedValue([]);

    const results = await adapter.findAll();

    expect(results).toEqual([]);
  });

  it('should pass limit and offset to repo', async () => {
    mockOrgRepo.findAll.mockResolvedValue([]);

    await adapter.findAll(10, 20);

    expect(mockOrgRepo.findAll).toHaveBeenCalledWith(10, 20);
  });
});
