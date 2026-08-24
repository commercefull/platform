jest.mock('../../infrastructure/repositories/ProductTypeRepository', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue([{ typeId: 't1', name: 'Simple' }]),
  },
}));

import { ListProductTypesUseCase } from './ListProductTypes';
import ProductTypeRepository from '../../infrastructure/repositories/ProductTypeRepository';

const mockRepo = ProductTypeRepository as unknown as Record<string, jest.Mock>;

describe('ListProductTypesUseCase', () => {
  let useCase: ListProductTypesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListProductTypesUseCase(mockRepo as never);
  });

  it('should list all product types', async () => {
    const result = await useCase.execute();
    expect(result).toHaveLength(1);
    expect(mockRepo.findAll).toHaveBeenCalled();
  });
});
