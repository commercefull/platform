import contentDataRepository from '../../infrastructure/repositories/ContentDataRepository';
import contentStructureRepository from '../../infrastructure/repositories/ContentStructureRepository';
import contentMediaDataRepository from '../../infrastructure/repositories/ContentMediaDataRepository';
import { CreatePageUseCase } from './CreatePage';
import { UpdatePageUseCase } from './UpdatePage';
import { PublishPageUseCase } from './PublishPage';
import { ManageContentUseCase } from './ManageContent';
import { UnpublishPageUseCase } from './page/UnpublishPage';
import { SchedulePageUseCase } from './page/SchedulePage';
import { DuplicatePageUseCase } from './page/DuplicatePage';
import { CreatePageVersionUseCase } from './page/CreatePageVersion';
import { RestorePageVersionUseCase } from './page/RestorePageVersion';
import { ReorderPageBlocksUseCase } from './block/ReorderPageBlocks';
import { CreateCategoryUseCase } from './category/CreateCategory';
import { UpdateCategoryUseCase } from './category/UpdateCategory';
import { DeleteCategoryUseCase } from './category/DeleteCategory';
import { MoveCategoryUseCase } from './category/MoveCategory';
import { CreateNavigationUseCase } from './navigation/CreateNavigation';
import { UpdateNavigationUseCase } from './navigation/UpdateNavigation';
import { AddNavigationItemUseCase } from './navigation/AddNavigationItem';
import { UploadMediaUseCase } from './media/UploadMedia';
import { DeleteMediaUseCase } from './media/DeleteMedia';
import { TrackMediaUsageUseCase } from './media/TrackMediaUsage';
import { OrganizeMediaFolderUseCase } from './media/OrganizeMediaFolder';
import { CreateRedirectUseCase } from './redirect/CreateRedirect';
import { UpdateRedirectUseCase } from './redirect/UpdateRedirect';
import { DeleteRedirectUseCase } from './redirect/DeleteRedirect';
import { CreatePageTranslationUseCase } from './translation/CreatePageTranslation';
import { UpdatePageTranslationUseCase } from './translation/UpdatePageTranslation';
import { DeletePageTranslationUseCase } from './translation/DeletePageTranslation';
import { AssignPageToCategoryUseCase } from './categorization/AssignPageToCategory';
import { RemovePageFromCategoryUseCase } from './categorization/RemovePageFromCategory';
import { SetPrimaryCategoryUseCase } from './categorization/SetPrimaryCategory';
import { CreateTemplateUseCase } from './template/CreateTemplate';
import { DuplicateTemplateUseCase } from './template/DuplicateTemplate';

const contentRepo = contentDataRepository.pages;
const pageVersionRepo = contentDataRepository.versions;
const pageTranslationRepo = contentDataRepository.translations;
const categoryRepo = contentStructureRepository.categories;
const categorizationRepo = contentStructureRepository.categorization;
const navigationRepo = contentStructureRepository.navigation;
const redirectRepo = contentStructureRepository.redirects;
const mediaRepo = contentMediaDataRepository.media;
const mediaUsageRepo = contentMediaDataRepository.usage;

export const createPageUseCase = new CreatePageUseCase(contentRepo);
export const updatePageUseCase = new UpdatePageUseCase(contentRepo);
export const publishPageUseCase = new PublishPageUseCase(contentRepo);
export const manageContentUseCase = new ManageContentUseCase(contentRepo, {
  categories: categoryRepo,
  navigation: navigationRepo,
  media: mediaRepo,
  redirects: redirectRepo,
  versions: pageVersionRepo,
  translations: pageTranslationRepo,
  categorization: categorizationRepo,
  mediaUsage: mediaUsageRepo,
});
export const unpublishPageUseCase = new UnpublishPageUseCase(contentRepo);
export const schedulePageUseCase = new SchedulePageUseCase(contentRepo);
export const duplicatePageUseCase = new DuplicatePageUseCase(contentRepo);
export const createPageVersionUseCase = new CreatePageVersionUseCase(contentRepo, pageVersionRepo);
export const restorePageVersionUseCase = new RestorePageVersionUseCase(contentRepo, pageVersionRepo);
export const reorderPageBlocksUseCase = new ReorderPageBlocksUseCase(contentRepo);

export const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo);
export const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepo);
export const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepo);
export const moveCategoryUseCase = new MoveCategoryUseCase(categoryRepo);

export const createNavigationUseCase = new CreateNavigationUseCase(navigationRepo);
export const updateNavigationUseCase = new UpdateNavigationUseCase(navigationRepo);
export const addNavigationItemUseCase = new AddNavigationItemUseCase(navigationRepo, contentRepo);

export const uploadMediaUseCase = new UploadMediaUseCase(mediaRepo);
export const deleteMediaUseCase = new DeleteMediaUseCase(mediaRepo);
export const trackMediaUsageUseCase = new TrackMediaUsageUseCase(mediaUsageRepo);
export const organizeMediaFolderUseCase = new OrganizeMediaFolderUseCase(mediaRepo);

export const createRedirectUseCase = new CreateRedirectUseCase(redirectRepo);
export const updateRedirectUseCase = new UpdateRedirectUseCase(redirectRepo);
export const deleteRedirectUseCase = new DeleteRedirectUseCase(redirectRepo);

export const createPageTranslationUseCase = new CreatePageTranslationUseCase(contentRepo, pageTranslationRepo);
export const updatePageTranslationUseCase = new UpdatePageTranslationUseCase(pageTranslationRepo);
export const deletePageTranslationUseCase = new DeletePageTranslationUseCase(pageTranslationRepo);

export const assignPageToCategoryUseCase = new AssignPageToCategoryUseCase(contentRepo, categoryRepo, categorizationRepo);
export const removePageFromCategoryUseCase = new RemovePageFromCategoryUseCase(categorizationRepo);
export const setPrimaryCategoryUseCase = new SetPrimaryCategoryUseCase(categorizationRepo);

export const createTemplateUseCase = new CreateTemplateUseCase(contentRepo);
export const duplicateTemplateUseCase = new DuplicateTemplateUseCase(contentRepo);
