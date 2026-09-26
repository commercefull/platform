import {
  ManageProductDownloadsUseCase,
  ManageProductImagesUseCase,
  ManageProductRelationshipsUseCase,
  ManageProductVariantsUseCase,
} from './ManageProductAssets';
import { lazyMock } from '../../tests/testUtils';

describe('ManageProductImagesUseCase', () => {
  let useCase: ManageProductImagesUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductImagesUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof ManageProductImagesUseCase>[0]>();
    useCase = new ManageProductImagesUseCase(mockRepo);
  });

  it('should list images for a product', async () => {
    mockRepo.findByProductId.mockResolvedValue([{ productImageId: 'img1' }]);
    expect(await useCase.listForProduct('p1')).toHaveLength(1);
  });

  it('should create an image with defaults', async () => {
    mockRepo.create.mockResolvedValue({ productImageId: 'img1', position: 0, isPrimary: false });
    await useCase.create('p1', { url: 'https://cdn/img.png' });
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', url: 'https://cdn/img.png', position: 0, isPrimary: false }),
    );
  });

  it('should update an image', async () => {
    mockRepo.update.mockResolvedValue({ productImageId: 'img1', isPrimary: true });
    const result = await useCase.update('img1', { isPrimary: true });
    expect(result.isPrimary).toBe(true);
  });

  it('should throw when updating a missing image', async () => {
    mockRepo.update.mockResolvedValue(null as never);
    await expect(useCase.update('missing', {})).rejects.toThrow('Product image not found');
  });

  it('should delete an image', async () => {
    mockRepo.delete.mockResolvedValue(true);
    await useCase.delete('img1');
    expect(mockRepo.delete).toHaveBeenCalledWith('img1');
  });

  it('should reorder images', async () => {
    await useCase.reorder('p1', ['img2', 'img1']);
    expect(mockRepo.reorder).toHaveBeenCalledWith('p1', ['img2', 'img1']);
  });

  it('should reject non-array imageIds', async () => {
    await expect(useCase.reorder('p1', 'img1')).rejects.toThrow('imageIds must be an array');
    expect(mockRepo.reorder).not.toHaveBeenCalled();
  });
});

describe('ManageProductDownloadsUseCase', () => {
  let useCase: ManageProductDownloadsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductDownloadsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof ManageProductDownloadsUseCase>[0]>();
    useCase = new ManageProductDownloadsUseCase(mockRepo);
  });

  it('should list downloads for a product', async () => {
    mockRepo.findByProductId.mockResolvedValue([{ productDownloadId: 'd1' }]);
    const result = await useCase.listForProduct('p1', true);
    expect(result).toHaveLength(1);
    expect(mockRepo.findByProductId).toHaveBeenCalledWith('p1', undefined, true);
  });

  it('should create a download with defaults', async () => {
    mockRepo.create.mockResolvedValue({ productDownloadId: 'd1' });
    await useCase.create('p1', { name: 'Manual', fileUrl: 'https://cdn/manual.pdf' });
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', name: 'Manual', fileUrl: 'https://cdn/manual.pdf', isActive: true, sortOrder: 0 }),
    );
  });

  it('should reject creation without name', async () => {
    await expect(useCase.create('p1', { fileUrl: 'u' })).rejects.toThrow('name is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should reject creation without fileUrl', async () => {
    await expect(useCase.create('p1', { name: 'Manual' })).rejects.toThrow('fileUrl is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should update a download', async () => {
    mockRepo.update.mockResolvedValue({ productDownloadId: 'd1', name: 'v2' });
    const result = await useCase.update('d1', { name: 'v2' });
    expect(result.name).toBe('v2');
  });

  it('should throw when updating a missing download', async () => {
    mockRepo.update.mockResolvedValue(null);
    await expect(useCase.update('missing', {})).rejects.toThrow('Download not found');
  });

  it('should delete a download', async () => {
    mockRepo.delete.mockResolvedValue(true);
    await useCase.delete('d1');
    expect(mockRepo.delete).toHaveBeenCalledWith('d1');
  });

  it('should throw when deleting a missing download', async () => {
    mockRepo.delete.mockResolvedValue(false);
    await expect(useCase.delete('missing')).rejects.toThrow('Download not found');
  });
});

describe('ManageProductRelationshipsUseCase', () => {
  let useCase: ManageProductRelationshipsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductRelationshipsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof ManageProductRelationshipsUseCase>[0]>();
    useCase = new ManageProductRelationshipsUseCase(mockRepo);
  });

  it('should list relationships for a product', async () => {
    mockRepo.findByProductId.mockResolvedValue([{ productRelatedId: 'r1' }]);
    const result = await useCase.listForProduct('p1', 'related');
    expect(result).toHaveLength(1);
    expect(mockRepo.findByProductId).toHaveBeenCalledWith('p1', 'related');
  });

  it('should create a relationship with defaults', async () => {
    mockRepo.create.mockResolvedValue({ productRelatedId: 'r1' });
    await useCase.create('p1', { relatedProductId: 'p2', type: 'up_sell' });
    expect(mockRepo.create).toHaveBeenCalledWith({
      productId: 'p1',
      relatedProductId: 'p2',
      type: 'up_sell',
      position: 0,
      isAutomated: false,
    });
  });

  it('should reject creation without relatedProductId', async () => {
    await expect(useCase.create('p1', { type: 'related' })).rejects.toThrow('relatedProductId is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should reject creation without type', async () => {
    await expect(useCase.create('p1', { relatedProductId: 'p2' })).rejects.toThrow(
      'type is required (related, accessory, cross_sell, up_sell, grouped)',
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should delete a relationship', async () => {
    mockRepo.delete.mockResolvedValue(true);
    await useCase.delete('r1');
    expect(mockRepo.delete).toHaveBeenCalledWith('r1');
  });

  it('should throw when deleting a missing relationship', async () => {
    mockRepo.delete.mockResolvedValue(false);
    await expect(useCase.delete('missing')).rejects.toThrow('Relationship not found');
  });
});

describe('ManageProductVariantsUseCase', () => {
  let useCase: ManageProductVariantsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductVariantsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof ManageProductVariantsUseCase>[0]>();
    useCase = new ManageProductVariantsUseCase(mockRepo);
  });

  it('should list variants for a product', async () => {
    mockRepo.findByProductId.mockResolvedValue([{ productVariantId: 'v1' }]);
    expect(await useCase.listForProduct('p1')).toHaveLength(1);
  });

  it('should find a variant by id', async () => {
    mockRepo.findById.mockResolvedValue({ productVariantId: 'v1' });
    expect(await useCase.findById('v1')).toBeTruthy();
  });

  it('should delete a variant', async () => {
    mockRepo.delete.mockResolvedValue({ deleted: true });
    await useCase.delete('v1');
    expect(mockRepo.delete).toHaveBeenCalledWith('v1');
  });
});
