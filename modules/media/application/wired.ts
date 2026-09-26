import { PostgreSQLMediaRepository } from '../infrastructure/repositories/mediaRepo';
import { SharpImageProcessingService } from '../infrastructure/services/SharpImageProcessingService';
import { StorageServiceFactory } from '../infrastructure/services/StorageServiceFactory';
import { ProcessImageUseCase } from './useCases/ProcessImage';
import { DownloadImageUseCase } from './useCases/DownloadImage';
import { UploadMediaUseCase } from './useCases/UploadMedia';
import { ListMediaUseCase } from './useCases/ListMedia';
import { DeleteMediaUseCase } from './useCases/DeleteMedia';

export { PostgreSQLMediaRepository, SharpImageProcessingService, StorageServiceFactory };

const mediaRepository = new PostgreSQLMediaRepository();
const imageProcessingService = new SharpImageProcessingService();
const storageService = StorageServiceFactory.create();

export const processImageUseCase = new ProcessImageUseCase(mediaRepository, imageProcessingService, storageService);
export const downloadImageUseCase = new DownloadImageUseCase(processImageUseCase);
export const uploadMediaUseCase = new UploadMediaUseCase(
  mediaRepository as unknown as ConstructorParameters<typeof UploadMediaUseCase>[0],
);
export const listMediaUseCase = new ListMediaUseCase(
  mediaRepository as unknown as ConstructorParameters<typeof ListMediaUseCase>[0],
);
export const deleteMediaUseCase = new DeleteMediaUseCase(
  mediaRepository as unknown as ConstructorParameters<typeof DeleteMediaUseCase>[0],
);
