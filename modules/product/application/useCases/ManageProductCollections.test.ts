jest.mock('../../infrastructure/repositories/productCollectionRepo', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue([{ productCollectionId: 'c1' }]),
    findById: jest.fn().mockResolvedValue({ productCollectionId: 'c1', name: 'Summer' }),
    create: jest.fn().mockResolvedValue({ productCollectionId: 'c2', name: 'Winter' }),
    update: jest.fn().mockResolvedValue({ productCollectionId: 'c1', name: 'Updated' }),
    softDelete: jest.fn().mockResolvedValue(true),
  },
}));

import { ManageProductCollectionsUseCase } from './ManageProductCollections';
import productCollectionRepo from '../../infrastructure/repositories/productCollectionRepo';

const mockRepo = productCollectionRepo as unknown as Record<string, jest.Mock>;

describe('ManageProductCollectionsUseCase', () => {
  let useCase: ManageProductCollectionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageProductCollectionsUseCase();
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('c1');
    expect(result).toEqual({ productCollectionId: 'c1', name: 'Summer' });
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'Winter' } as never);
    expect(result).toEqual({ productCollectionId: 'c2', name: 'Winter' });
  });

  it('should update', async () => {
    const result = await useCase.update('c1', { name: 'Updated' } as never);
    expect(result).toEqual({ productCollectionId: 'c1', name: 'Updated' });
  });

  it('should soft delete', async () => {
    const result = await useCase.softDelete('c1');
    expect(result).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('c1');
  });
});
