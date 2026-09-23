
import { ManageProductTagsUseCase } from './ManageProductTags';
import { createProductTag, lazyMock } from '../../tests/testUtils';

;

describe('ManageProductTagsUseCase', () => {
  let useCase: ManageProductTagsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductTagsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof ManageProductTagsUseCase>[0]>();
    mockRepo.findAll.mockResolvedValue([createProductTag({ name: 'New' })]);
    mockRepo.create.mockResolvedValue(createProductTag({ productTagId: 't2', name: 'Sale' }));
    mockRepo.softDelete.mockResolvedValue(true);
    useCase = new ManageProductTagsUseCase(mockRepo);
  });

  it('should find all tags', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should create tag', async () => {
    const result = await useCase.create({ name: 'Sale', slug: 'sale' });
    expect(result).toEqual(createProductTag({ productTagId: 't2', name: 'Sale' }));
  });

  it('should soft delete tag', async () => {
    const result = await useCase.softDelete('t1');
    expect(result).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('t1');
  });
});
