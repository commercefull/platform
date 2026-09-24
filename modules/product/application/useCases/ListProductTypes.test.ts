
import { ListProductTypesUseCase } from './ListProductTypes';
import { createProductTypeRow, lazyMock } from '../../tests/testUtils';

;

describe('ListProductTypesUseCase', () => {
  let useCase: ListProductTypesUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ListProductTypesUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof ListProductTypesUseCase>[0]>();
    mockRepo.findAll.mockResolvedValue([createProductTypeRow({ productTypeId: 't1', name: 'Simple' })]);
    useCase = new ListProductTypesUseCase(mockRepo);
  });

  it('should list all product types', async () => {
    const result = await useCase.execute();
    expect(result).toHaveLength(1);
    expect(mockRepo.findAll).toHaveBeenCalled();
  });
});
