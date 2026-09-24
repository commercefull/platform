import { ListProductsForContextUseCase, ListProductsForContextCommand } from './ListProductsForContext';
import { ProductValidationError } from '../../domain/errors/ProductErrors';
import { createProduct, lazyMock } from '../../tests/testUtils';

let mockProductRepository: jest.Mocked<ConstructorParameters<typeof ListProductsForContextUseCase>[0]>;
let mockStoreLookupPort: jest.Mocked<ConstructorParameters<typeof ListProductsForContextUseCase>[1]>;
let mockSystemConfigPort: jest.Mocked<ConstructorParameters<typeof ListProductsForContextUseCase>[2]>;
let mockPricingPort: jest.Mocked<ConstructorParameters<typeof ListProductsForContextUseCase>[3]>;
let mockOrganizationLookupPort: jest.Mocked<NonNullable<ConstructorParameters<typeof ListProductsForContextUseCase>[4]>>;

describe('ListProductsForContextUseCase', () => {
  let useCase: ListProductsForContextUseCase;

  beforeEach(() => {
    mockProductRepository = lazyMock<ConstructorParameters<typeof ListProductsForContextUseCase>[0]>();
    mockProductRepository.findAll.mockResolvedValue({
      data: [createProduct()],
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
      length: 1,
    });
    mockStoreLookupPort = lazyMock<ConstructorParameters<typeof ListProductsForContextUseCase>[1]>();
    mockStoreLookupPort.findById.mockResolvedValue({ storeId: 's1', organizationId: 'org1' });
    mockSystemConfigPort = lazyMock<ConstructorParameters<typeof ListProductsForContextUseCase>[2]>();
    mockSystemConfigPort.findActive.mockResolvedValue({ isMarketplace: false, isMultiStore: false, isSingleStore: true });
    mockPricingPort = lazyMock<ConstructorParameters<typeof ListProductsForContextUseCase>[3]>();
    mockPricingPort.getBasePrices.mockResolvedValue([]);
    mockOrganizationLookupPort = lazyMock<NonNullable<ConstructorParameters<typeof ListProductsForContextUseCase>[4]>>();
    mockOrganizationLookupPort.findById.mockResolvedValue({ id: 'org1', name: 'Org', status: 'active' });
    mockOrganizationLookupPort.findAll.mockResolvedValue([{ id: 'org1', name: 'Org', status: 'active' }]);
    useCase = new ListProductsForContextUseCase(
      mockProductRepository,
      mockStoreLookupPort,
      mockSystemConfigPort,
      mockPricingPort,
      mockOrganizationLookupPort,
    );
  });

  it('should list products for context (happy path)', async () => {
    const result = await useCase.execute(
      new ListProductsForContextCommand({
        organizationId: 'org1',
      }),
    );

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should list products with store context', async () => {
    const result = await useCase.execute(
      new ListProductsForContextCommand({
        storeId: 's1',
      }),
    );

    expect(result.products).toHaveLength(1);
  });

  it('should throw ProductValidationError when no org lookup port in single-store mode', async () => {
    const useCaseNoOrg = new ListProductsForContextUseCase(
      mockProductRepository,
      mockStoreLookupPort,
      mockSystemConfigPort,
      mockPricingPort,
    );

    await expect(useCaseNoOrg.execute(new ListProductsForContextCommand({}))).rejects.toThrow(ProductValidationError);
  });
});
