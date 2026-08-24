jest.mock('../../infrastructure/repositories/DynamicAttributeRepository', () => ({
  __esModule: true,
  DynamicAttributeRepository: jest.fn().mockImplementation(() => ({
    getProductAttributes: jest.fn().mockResolvedValue([{ attributeId: 'a1', name: 'Color', value: 'Red' }]),
    findAllAttributes: jest.fn().mockResolvedValue([{ attributeId: 'a1', name: 'Color' }]),
  })),
}));

import { GetProductAttributesUseCase } from './GetProductAttributes';

describe('GetProductAttributesUseCase', () => {
  let useCase: GetProductAttributesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetProductAttributesUseCase();
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
