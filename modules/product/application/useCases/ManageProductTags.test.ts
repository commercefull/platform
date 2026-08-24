jest.mock('../../infrastructure/repositories/productTagRepo', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue([{ tagId: 't1', name: 'New' }]),
    create: jest.fn().mockResolvedValue({ tagId: 't2', name: 'Sale' }),
    softDelete: jest.fn().mockResolvedValue(true),
  },
}));

import { ManageProductTagsUseCase } from './ManageProductTags';
import productTagRepo from '../../infrastructure/repositories/productTagRepo';

const mockRepo = productTagRepo as unknown as Record<string, jest.Mock>;

describe('ManageProductTagsUseCase', () => {
  let useCase: ManageProductTagsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageProductTagsUseCase();
  });

  it('should find all tags', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should create tag', async () => {
    const result = await useCase.create({ name: 'Sale' } as never);
    expect(result).toEqual({ tagId: 't2', name: 'Sale' });
  });

  it('should soft delete tag', async () => {
    const result = await useCase.softDelete('t1');
    expect(result).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('t1');
  });
});
