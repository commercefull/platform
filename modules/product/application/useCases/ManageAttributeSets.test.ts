import { ManageAttributeSetsUseCase } from './ManageAttributeSets';
import { lazyMock } from '../../tests/testUtils';

describe('ManageAttributeSetsUseCase', () => {
  let useCase: ManageAttributeSetsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageAttributeSetsUseCase>[0]>;

  const set = { productAttributeSetId: 's1', name: 'Electronics', code: 'electronics' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof ManageAttributeSetsUseCase>[0]>();
    useCase = new ManageAttributeSetsUseCase(mockRepo);
  });

  it('should list attribute sets', async () => {
    mockRepo.findAll.mockResolvedValue([set]);
    const result = await useCase.list();
    expect(result).toHaveLength(1);
  });

  it('should return attribute set with attributes when it exists', async () => {
    mockRepo.findByIdWithAttributes.mockResolvedValue(set);
    const result = await useCase.getByIdWithAttributes('s1');
    expect(result).toEqual(set);
  });

  it('should throw when attribute set not found', async () => {
    mockRepo.findByIdWithAttributes.mockResolvedValue(null);
    await expect(useCase.getByIdWithAttributes('missing')).rejects.toThrow('Attribute set not found');
  });

  it('should create an attribute set', async () => {
    mockRepo.findByCode.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(set);
    const result = await useCase.create({ name: 'Electronics', code: 'electronics' });
    expect(result).toEqual(set);
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Electronics', code: 'electronics' }));
  });

  it('should reject creation without name or code', async () => {
    await expect(useCase.create({ name: 'Electronics' })).rejects.toThrow('Name and code are required');
    await expect(useCase.create({ code: 'electronics' })).rejects.toThrow('Name and code are required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate codes', async () => {
    mockRepo.findByCode.mockResolvedValue(set);
    await expect(useCase.create({ name: 'Electronics', code: 'electronics' })).rejects.toThrow(
      'Attribute set with code "electronics" already exists',
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should update an existing attribute set', async () => {
    mockRepo.findById.mockResolvedValue(set);
    mockRepo.update.mockResolvedValue({ ...set, name: 'Updated' });
    const result = await useCase.update('s1', { name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });

  it('should throw when updating a missing attribute set', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.update('missing', { name: 'x' })).rejects.toThrow('Attribute set not found');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('should delete an existing attribute set', async () => {
    mockRepo.findById.mockResolvedValue(set);
    mockRepo.delete.mockResolvedValue(true);
    await useCase.delete('s1');
    expect(mockRepo.delete).toHaveBeenCalledWith('s1');
  });

  it('should throw when deleting a missing attribute set', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.delete('missing')).rejects.toThrow('Attribute set not found');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('should add an attribute and return the refreshed set', async () => {
    mockRepo.findByIdWithAttributes.mockResolvedValue(set);
    const result = await useCase.addAttribute('s1', { attributeId: 'a1', position: 2 });
    expect(mockRepo.addAttribute).toHaveBeenCalledWith({ attributeSetId: 's1', attributeId: 'a1', position: 2 });
    expect(result).toEqual(set);
  });

  it('should reject adding without attributeId', async () => {
    await expect(useCase.addAttribute('s1', {})).rejects.toThrow('attributeId is required');
    expect(mockRepo.addAttribute).not.toHaveBeenCalled();
  });

  it('should remove an attribute', async () => {
    mockRepo.removeAttribute.mockResolvedValue(true);
    await useCase.removeAttribute('s1', 'a1');
    expect(mockRepo.removeAttribute).toHaveBeenCalledWith('s1', 'a1');
  });

  it('should reorder attributes', async () => {
    await useCase.reorderAttributes('s1', ['a2', 'a1']);
    expect(mockRepo.reorderAttributes).toHaveBeenCalledWith('s1', ['a2', 'a1']);
  });

  it('should reject non-array attributeIds', async () => {
    await expect(useCase.reorderAttributes('s1', 'a1')).rejects.toThrow('attributeIds must be an array');
    expect(mockRepo.reorderAttributes).not.toHaveBeenCalled();
  });
});
