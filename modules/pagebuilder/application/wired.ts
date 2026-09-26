import { PageDraftRepositoryImpl } from '../infrastructure/repositories/PageDraftRepositoryImpl';
import { ThemeRepositoryImpl } from '../../theme/infrastructure/repositories/ThemeRepositoryImpl';
import { ManageDraftsUseCase } from './useCases/ManageDrafts';
import { ManageBlocksUseCase } from './useCases/ManageBlocks';
import { PublishDraftUseCase } from './useCases/PublishDraft';
import { PreviewDraftUseCase } from './useCases/PreviewDraft';
import { GetBlockTypesUseCase } from './useCases/GetBlockTypes';

const draftRepo = new PageDraftRepositoryImpl();
const themeRepo = new ThemeRepositoryImpl();

export const manageDraftsUseCase = new ManageDraftsUseCase(draftRepo);
export const manageBlocksUseCase = new ManageBlocksUseCase(draftRepo);
export const publishDraftUseCase = new PublishDraftUseCase(draftRepo);
export const previewDraftUseCase = new PreviewDraftUseCase(draftRepo, themeRepo);
export const getBlockTypesUseCase = new GetBlockTypesUseCase();

export { PageDraftRepositoryImpl, ThemeRepositoryImpl };
