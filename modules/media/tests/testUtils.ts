/**
 * Shared test utilities for media unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (uuid, logger) before the use cases under test are evaluated.
 * Domain ports and services are mocked; local ports are typed via
 * ConstructorParameters where the interface is not exported.
 */

import { Media } from '../domain/entities/Media';
import type { MediaRepository } from '../domain/repositories/MediaRepository';
import type { ImageProcessingService, ImageProcessingResult } from '../domain/services/ImageProcessingService';
import type { StorageService } from '../domain/services/StorageService';
import type { ProcessImageUseCase } from '../application/useCases/ProcessImage';
import type { DeleteMediaUseCase } from '../application/useCases/DeleteMedia';
import type { ListMediaUseCase } from '../application/useCases/ListMedia';
import type { UploadMediaUseCase } from '../application/useCases/UploadMedia';

jest.mock('../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn(() => 'test-uuid'),
}));

jest.mock('../../../libs/logger', () => ({
  __esModule: true,
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

type DeleteMediaRepository = ConstructorParameters<typeof DeleteMediaUseCase>[0];
type ListMediaRepository = ConstructorParameters<typeof ListMediaUseCase>[0];
type UploadMediaRepository = ConstructorParameters<typeof UploadMediaUseCase>[0];

export function createMediaRepository(): jest.Mocked<MediaRepository> {
  const repository: jest.Mocked<MediaRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  repository.save.mockResolvedValue(undefined);
  repository.findById.mockResolvedValue(null);
  repository.findByIds.mockResolvedValue([]);
  repository.findAll.mockResolvedValue([]);
  repository.delete.mockResolvedValue(undefined);
  repository.count.mockResolvedValue(0);
  return repository;
}

export function createImageProcessingService(result?: ImageProcessingResult): jest.Mocked<ImageProcessingService> {
  const service: jest.Mocked<ImageProcessingService> = {
    processImage: jest.fn(),
    resizeImage: jest.fn(),
    convertToWebP: jest.fn(),
    generateThumbnail: jest.fn(),
  };
  service.processImage.mockResolvedValue(
    result ?? {
      original: { buffer: Buffer.from('img'), format: 'jpeg', size: 1024 },
      webp: { buffer: Buffer.from('webp'), format: 'webp', width: 800, height: 600, size: 512 },
      thumbnail: { buffer: Buffer.from('thumb'), format: 'webp', width: 300, height: 300, size: 128 },
    },
  );
  return service;
}

export function createStorageService(): jest.Mocked<StorageService> {
  const service: jest.Mocked<StorageService> = {
    upload: jest.fn(),
    uploadFile: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(),
    exists: jest.fn(),
    getMetadata: jest.fn(),
  };
  service.upload.mockImplementation((buffer, key, mimeType) =>
    Promise.resolve({ url: `https://cdn.example.com/${key}`, key, size: buffer.length, mimeType }),
  );
  service.uploadFile.mockImplementation((filePath, key) =>
    Promise.resolve({ url: `https://cdn.example.com/${key}`, key, size: 0, mimeType: 'application/octet-stream' }),
  );
  service.download.mockResolvedValue(Buffer.from(''));
  service.delete.mockResolvedValue(undefined);
  service.getSignedUrl.mockResolvedValue('https://cdn.example.com/signed');
  service.exists.mockResolvedValue(true);
  service.getMetadata.mockResolvedValue({});
  return service;
}

export function createProcessImageUseCase(
  result?: Awaited<ReturnType<ProcessImageUseCase['execute']>>,
): jest.Mocked<ProcessImageUseCase> {
  const useCase = { execute: jest.fn() } as unknown as jest.Mocked<ProcessImageUseCase>;
  useCase.execute.mockResolvedValue(
    result ?? {
      media: Media.create({
        mediaId: 'media-1',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        originalUrl: 'https://cdn.example.com/original.jpg',
      }),
      urls: { original: 'https://cdn.example.com/original.jpg' },
    },
  );
  return useCase;
}

export function createDeleteMediaRepository(): jest.Mocked<DeleteMediaRepository> {
  const repository: jest.Mocked<DeleteMediaRepository> = {
    findById: jest.fn(),
    findUsages: jest.fn(),
    delete: jest.fn(),
  };
  repository.findById.mockResolvedValue({ mediaId: 'm1' });
  repository.findUsages.mockResolvedValue(null);
  repository.delete.mockResolvedValue(undefined);
  return repository;
}

type MediaRecord = NonNullable<Awaited<ReturnType<ListMediaRepository['findAll']>>>[number];

export function createMediaRecord(overrides: Partial<MediaRecord> = {}): MediaRecord {
  return {
    mediaId: 'm1',
    fileName: 'image1.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024,
    url: '/img1.jpg',
    mediaType: 'image',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createListMediaRepository(items: MediaRecord[] = []): jest.Mocked<ListMediaRepository> {
  const repository: jest.Mocked<ListMediaRepository> = {
    findAll: jest.fn(),
    count: jest.fn(),
  };
  repository.findAll.mockResolvedValue(items);
  repository.count.mockResolvedValue(items.length);
  return repository;
}

export function createUploadMediaRepository(): jest.Mocked<UploadMediaRepository> {
  const repository: jest.Mocked<UploadMediaRepository> = {
    create: jest.fn(),
  };
  repository.create.mockImplementation(data =>
    Promise.resolve({
      mediaId: data.mediaId,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      url: data.url,
      createdAt: new Date('2026-01-01'),
    }),
  );
  return repository;
}

export function mockFetchResponse(options: {
  status?: number;
  contentType?: string;
  body?: ArrayBuffer;
}): jest.MockedFunction<typeof fetch> {
  const { status = 200, contentType = 'image/png', body = new ArrayBuffer(4) } = options;
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      get: (key: string) => {
        if (key === 'content-type') return contentType;
        if (key === 'content-length') return String(body.byteLength);
        return null;
      },
    },
    arrayBuffer: () => Promise.resolve(body),
  } as unknown as Response;

  return jest.spyOn(globalThis, 'fetch').mockResolvedValue(response) as jest.MockedFunction<typeof fetch>;
}
