import { PageDraftRepositoryImpl } from '../infrastructure/repositories/PageDraftRepositoryImpl';
import { ThemeRepositoryImpl } from '../../theme/infrastructure/repositories/ThemeRepositoryImpl';
import {
  ManageDraftsUseCase,
  PublishDraftUseCase,
  PreviewDraftUseCase,
  GetBlockTypesUseCase,
} from './useCases/PageBuilder';

const draftRepo = new PageDraftRepositoryImpl();
const themeRepo = new ThemeRepositoryImpl();

export const manageDraftsUseCase = new ManageDraftsUseCase(draftRepo);
export const publishDraftUseCase = new PublishDraftUseCase(draftRepo);
export const previewDraftUseCase = new PreviewDraftUseCase(draftRepo, themeRepo);
export const getBlockTypesUseCase = new GetBlockTypesUseCase();
