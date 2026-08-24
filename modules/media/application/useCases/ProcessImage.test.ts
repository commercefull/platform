import { ProcessImageUseCase} from './ProcessImage';

describe('ProcessImageUseCase', () => {
  let useCase: ProcessImageUseCase;
  let mockMediaRepo: Record<string, jest.Mock>;
  let mockImageService: Record<string, jest.Mock>;
  let mockStorageService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockImageService = {
      processImage: jest.fn().mockResolvedValue({
        original: { buffer: Buffer.from('img'), size: 1024 },
        webp: { buffer: Buffer.from('webp'), size: 512 },
        thumbnail: { buffer: Buffer.from('thumb'), size: 128 },
        responsive: { '640': { buffer: Buffer.from('r640'), size: 256 } },
      }),
    };
    mockStorageService = {
      upload: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/media/test.jpg' }),
    };
    mockMediaRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProcessImageUseCase(mockMediaRepo as never, mockImageService as never, mockStorageService as never);
  });

  it('should process image (happy path)', async () => {
    const result = await useCase.execute({
      file: { buffer: Buffer.from('raw-image'), originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 2048 },
      altText: 'Test photo',
    });

    expect(result.media).toBeDefined();
    expect(result.urls.original).toContain('cdn.example.com');
    expect(mockMediaRepo.save).toHaveBeenCalled();
  });

  it('should upload multiple formats', async () => {
    const result = await useCase.execute({
      file: { buffer: Buffer.from('raw'), originalname: 'img.png', mimetype: 'image/png', size: 1024 },
    });

    expect(mockStorageService.upload).toHaveBeenCalledTimes(3);
    expect(result.urls.webp).toBeDefined();
    expect(result.urls.thumbnail).toBeDefined();
  });
});
