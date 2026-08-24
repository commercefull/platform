/**
 * Unit Tests for UploadMedia Use Case
 */

import { UploadMediaUseCase } from './UploadMedia';
import { MediaValidationError } from '../../domain/errors/MediaErrors';

describe('UploadMediaUseCase', () => {
  let useCase: UploadMediaUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockResolvedValue({
        mediaId: 'med-1',
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 102400,
        url: 'https://cdn.example.com/photo.jpg',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        createdAt: new Date('2024-06-01'),
      }),
    };
    useCase = new UploadMediaUseCase(mockRepo as never as ConstructorParameters<typeof UploadMediaUseCase>[0]);
  });

  it('should upload media successfully', async () => {
    const result = await useCase.execute({
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 102400,
      filePath: '/uploads/photo.jpg',
      url: 'https://cdn.example.com/photo.jpg',
    });

    expect(result.mediaId).toBeDefined();
    expect(result.fileName).toBe('photo.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.url).toBe('https://cdn.example.com/photo.jpg');
    expect(result.thumbnailUrl).toBe('https://cdn.example.com/thumb.jpg');
    expect(result.createdAt).toBe(new Date('2024-06-01').toISOString());
  });

  it('should pass altText, caption, folderId, tags to repository', async () => {
    await useCase.execute({
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 102400,
      filePath: '/uploads/photo.jpg',
      url: 'https://cdn.example.com/photo.jpg',
      altText: 'A photo',
      caption: 'My caption',
      folderId: 'folder-1',
      uploadedBy: 'user-1',
      tags: ['nature'],
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      altText: 'A photo',
      caption: 'My caption',
      folderId: 'folder-1',
      uploadedBy: 'user-1',
      tags: ['nature'],
    }));
  });

  it('should default tags to empty array', async () => {
    await useCase.execute({
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 102400,
      filePath: '/uploads/photo.jpg',
      url: 'https://cdn.example.com/photo.jpg',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      tags: [],
    }));
  });

  it('should determine media type as image', async () => {
    await useCase.execute({
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      filePath: '/p',
      url: 'u',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      mediaType: 'image',
    }));
  });

  it('should determine media type as video', async () => {
    await useCase.execute({
      fileName: 'vid.mp4',
      mimeType: 'video/mp4',
      fileSize: 5000000,
      filePath: '/v',
      url: 'u',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      mediaType: 'video',
    }));
  });

  it('should determine media type as document for PDF', async () => {
    await useCase.execute({
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
      fileSize: 5000,
      filePath: '/d',
      url: 'u',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      mediaType: 'document',
    }));
  });

  it('should determine media type as file for unknown types', async () => {
    await useCase.execute({
      fileName: 'data.bin',
      mimeType: 'application/octet-stream',
      fileSize: 5000,
      filePath: '/d',
      url: 'u',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      mediaType: 'file',
    }));
  });

  it('should throw MediaValidationError when fileName is missing', async () => {
    await expect(
      useCase.execute({ fileName: '', mimeType: 'image/jpeg', fileSize: 100, filePath: '/p', url: 'u' }),
    ).rejects.toThrow(MediaValidationError);
  });

  it('should throw MediaValidationError when mimeType is missing', async () => {
    await expect(
      useCase.execute({ fileName: 'photo.jpg', mimeType: '', fileSize: 100, filePath: '/p', url: 'u' }),
    ).rejects.toThrow(MediaValidationError);
  });

  it('should throw MediaValidationError when url is missing', async () => {
    await expect(
      useCase.execute({ fileName: 'photo.jpg', mimeType: 'image/jpeg', fileSize: 100, filePath: '/p', url: '' }),
    ).rejects.toThrow(MediaValidationError);
  });
});
