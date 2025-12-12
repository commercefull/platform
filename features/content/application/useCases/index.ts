/**
 * Content Use Cases Index
 * Export all use cases for the content feature
 */

// Page Use Cases
export { CreatePageUseCase, CreatePageCommand, PageResponse } from './CreatePage';
export { UpdatePageUseCase, UpdatePageCommand, UpdatePageResponse } from './UpdatePage';
export { PublishPageUseCase, PublishPageCommand, PublishPageResponse } from './PublishPage';
export { DuplicatePageUseCase, DuplicatePageCommand, DuplicatePageResponse } from './page/DuplicatePage';
export { SchedulePageUseCase, SchedulePageCommand, SchedulePageResponse } from './page/SchedulePage';
export { GetPageWithBlocksUseCase, GetPageWithBlocksQuery, PageWithBlocksResponse } from './page/GetPageWithBlocks';

// Block Use Cases
export { AddBlockToPageUseCase, AddBlockToPageCommand, BlockResponse } from './block/AddBlockToPage';
export { ReorderPageBlocksUseCase, ReorderPageBlocksCommand, ReorderBlocksResponse } from './block/ReorderPageBlocks';

// Category Use Cases
export { CreateCategoryUseCase, CreateCategoryCommand, CategoryResponse } from './category/CreateCategory';
export { GetCategoryTreeUseCase, GetCategoryTreeQuery, CategoryTreeNode } from './category/GetCategoryTree';
export { MoveCategoryUseCase, MoveCategoryCommand, MoveCategoryResponse } from './category/MoveCategory';

// Navigation Use Cases
export { CreateNavigationUseCase, CreateNavigationCommand, NavigationResponse } from './navigation/CreateNavigation';
export { AddNavigationItemUseCase, AddNavigationItemCommand, NavigationItemResponse } from './navigation/AddNavigationItem';
export { GetNavigationWithItemsUseCase, GetNavigationWithItemsQuery, NavigationWithItemsResponse } from './navigation/GetNavigationWithItems';

// Media Use Cases
export { UploadMediaUseCase, UploadMediaCommand, MediaResponse } from './media/UploadMedia';
export { 
  OrganizeMediaFolderUseCase, 
  CreateFolderCommand, 
  MoveFolderCommand, 
  MoveMediaToFolderCommand,
  FolderResponse,
  FolderTreeNode 
} from './media/OrganizeMediaFolder';

// Template Use Cases
export { CreateTemplateUseCase, CreateTemplateCommand, TemplateResponse } from './template/CreateTemplate';
export { DuplicateTemplateUseCase, DuplicateTemplateCommand, DuplicateTemplateResponse } from './template/DuplicateTemplate';

// Redirect Use Cases
export { CreateRedirectUseCase, CreateRedirectCommand, RedirectResponse } from './redirect/CreateRedirect';
export { ProcessRedirectUseCase, ProcessRedirectQuery, RedirectResult } from './redirect/ProcessRedirect';
