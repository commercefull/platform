import { ManageProductTypesUseCase } from './ManageProductTypes';
import { lazyMock } from '../../tests/testUtils';

describe('ManageProductTypesUseCase', () => {
  let useCase: ManageProductTypesUseCase;
  let mockTypeRepo: jest.Mocked<ConstructorParameters<typeof ManageProductTypesUseCase>[0]>;
  let mockSetRepo: jest.Mocked<ConstructorParameters<typeof ManageProductTypesUseCase>[1]>;

  const type = { productTypeId: 't1', name: 'Shoes', slug: 'shoes', createdAt: new Date(), updatedAt: new Date() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTypeRepo = lazyMock<ConstructorParameters<typeof ManageProductTypesUseCase>[0]>();
    mockSetRepo = lazyMock<ConstructorParameters<typeof ManageProductTypesUseCase>[1]>();
    useCase = new ManageProductTypesUseCase(mockTypeRepo, mockSetRepo);
  });

  it('should list all product types', async () => {
    mockTypeRepo.findAll.mockResolvedValue([type]);
    const result = await useCase.list();
    expect(result).toHaveLength(1);
    expect(mockTypeRepo.findActive).not.toHaveBeenCalled();
  });

  it('should list only active product types when activeOnly', async () => {
    mockTypeRepo.findActive.mockResolvedValue([type]);
    await useCase.list(true);
    expect(mockTypeRepo.findActive).toHaveBeenCalled();
    expect(mockTypeRepo.findAll).not.toHaveBeenCalled();
  });

  it('should get a product type with its attribute sets', async () => {
    mockTypeRepo.findById.mockResolvedValue(type);
    mockSetRepo.findByProductType.mockResolvedValue([{ productAttributeSetId: 's1' }]);
    const result = await useCase.getByIdWithAttributeSets('t1');
    expect(result.attributeSets).toHaveLength(1);
  });

  it('should throw when product type not found', async () => {
    mockTypeRepo.findById.mockResolvedValue(null);
    await expect(useCase.getById('missing')).rejects.toThrow('Product type not found');
  });

  it('should create a product type and derive slug from name', async () => {
    mockTypeRepo.findBySlug.mockResolvedValue(null);
    mockTypeRepo.create.mockResolvedValue(type);
    const result = await useCase.create({ name: 'My Shoes!' });
    expect(result).toEqual(type);
    expect(mockTypeRepo.findBySlug).toHaveBeenCalledWith('my-shoes-');
  });

  it('should reject creation without a name', async () => {
    await expect(useCase.create({})).rejects.toThrow('Name is required');
    expect(mockTypeRepo.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate slugs on create', async () => {
    mockTypeRepo.findBySlug.mockResolvedValue(type);
    await expect(useCase.create({ name: 'Shoes', slug: 'shoes' })).rejects.toThrow(
      'Product type with slug "shoes" already exists',
    );
    expect(mockTypeRepo.create).not.toHaveBeenCalled();
  });

  it('should update when slug is unchanged', async () => {
    mockTypeRepo.findById.mockResolvedValue(type);
    mockTypeRepo.update.mockResolvedValue(type);
    await useCase.update('t1', { slug: 'shoes', name: 'Renamed' });
    expect(mockTypeRepo.findBySlug).not.toHaveBeenCalled();
    expect(mockTypeRepo.update).toHaveBeenCalledWith('t1', { slug: 'shoes', name: 'Renamed' });
  });

  it('should reject updates to a slug owned by another type', async () => {
    mockTypeRepo.findById.mockResolvedValue(type);
    mockTypeRepo.findBySlug.mockResolvedValue({ ...type, productTypeId: 'other' });
    await expect(useCase.update('t1', { slug: 'taken' })).rejects.toThrow('Product type with slug "taken" already exists');
    expect(mockTypeRepo.update).not.toHaveBeenCalled();
  });

  it('should delete an existing product type', async () => {
    mockTypeRepo.findById.mockResolvedValue(type);
    await useCase.delete('t1');
    expect(mockTypeRepo.delete).toHaveBeenCalledWith('t1');
  });

  it('should throw when deleting a missing product type', async () => {
    mockTypeRepo.findById.mockResolvedValue(null);
    await expect(useCase.delete('missing')).rejects.toThrow('Product type not found');
    expect(mockTypeRepo.delete).not.toHaveBeenCalled();
  });

  it('should return attributes for a product type', async () => {
    mockTypeRepo.findById.mockResolvedValue(type);
    mockSetRepo.getAttributesForProductType.mockResolvedValue([{ productAttributeId: 'a1' }]);
    const result = await useCase.getAttributes('t1');
    expect(result).toHaveLength(1);
  });
});
