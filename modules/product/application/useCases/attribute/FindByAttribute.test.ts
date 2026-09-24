import { FindByAttributeUseCase } from './FindByAttribute';
import type { ProductSearchServicePort } from './SearchProducts';
import { createProductSearchRow, lazyMock } from '../../../tests/testUtils';

describe('FindByAttributeUseCase', () => {
  let useCase: FindByAttributeUseCase;
  let mockService: jest.Mocked<ProductSearchServicePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = lazyMock<ProductSearchServicePort>();
    useCase = new FindByAttributeUseCase(mockService);
  });

  it('should return products matching the attribute filter', async () => {
    const products = [createProductSearchRow(), createProductSearchRow()];
    mockService.findByAttribute.mockResolvedValue(products);

    const result = await useCase.execute({ attributeCode: 'color', value: 'red' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(products);
    expect(mockService.findByAttribute).toHaveBeenCalledWith('color', 'red');
  });

  it('should return failure when the search service throws', async () => {
    mockService.findByAttribute.mockRejectedValue(new Error('index unavailable'));

    const result = await useCase.execute({ attributeCode: 'color', value: 'red' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('index unavailable');
  });
});
