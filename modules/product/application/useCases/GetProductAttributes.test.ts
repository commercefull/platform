
import { GetProductAttributesUseCase } from './GetProductAttributes';
import { createAttribute, createAttributeData, lazyMock } from '../../tests/testUtils';

describe('GetProductAttributesUseCase', () => {
  let useCase: GetProductAttributesUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetProductAttributesUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof GetProductAttributesUseCase>[0]>();
    mockRepo.getProductAttributes.mockResolvedValue([{ ...createAttributeData(), attribute: createAttribute() }]);
    mockRepo.findAllAttributes.mockResolvedValue([createAttribute()]);
    useCase = new GetProductAttributesUseCase(mockRepo);
  });

  it('should get product attributes', async () => {
    const result = await useCase.getProductAttributes('p1');
    expect(result).toHaveLength(1);
  });

  it('should find all attributes', async () => {
    const result = await useCase.findAllAttributes();
    expect(result).toHaveLength(1);
  });
});
