import { AppError } from '../../../../libs/errors';

export class ContentPageNotFoundError extends AppError {
  constructor(pageId: string) {
    super(`Content page not found: ${pageId}`, 404, { code: 'content.page_not_found' });
  }
}

export class ContentBlockNotFoundError extends AppError {
  constructor(blockId: string) {
    super(`Content block not found: ${blockId}`, 404, { code: 'content.block_not_found' });
  }
}

export class ContentTypeNotFoundError extends AppError {
  constructor(typeId: string) {
    super(`Content type not found: ${typeId}`, 404, { code: 'content.type_not_found' });
  }
}

export class ContentTemplateNotFoundError extends AppError {
  constructor(templateId: string) {
    super(`Content template not found: ${templateId}`, 404, { code: 'content.template_not_found' });
  }
}

export class MediaFolderNotFoundError extends AppError {
  constructor(folderId: string) {
    super(`Media folder not found: ${folderId}`, 404, { code: 'content.media_folder_not_found' });
  }
}

export class MediaAssetNotFoundError extends AppError {
  constructor(assetId: string) {
    super(`Media asset not found: ${assetId}`, 404, { code: 'content.media_asset_not_found' });
  }
}

export class NavigationMenuNotFoundError extends AppError {
  constructor(menuId: string) {
    super(`Navigation menu not found: ${menuId}`, 404, { code: 'content.navigation_not_found' });
  }
}

export class RedirectNotFoundError extends AppError {
  constructor(redirectId: string) {
    super(`Redirect not found: ${redirectId}`, 404, { code: 'content.redirect_not_found' });
  }
}

export class CategoryNotFoundError extends AppError {
  constructor(categoryId: string) {
    super(`Category not found: ${categoryId}`, 404, { code: 'content.category_not_found' });
  }
}

export class SlugAlreadyExistsError extends AppError {
  constructor(slug: string) {
    super(`Slug already exists: ${slug}`, 409, { code: 'content.slug_already_exists' });
  }
}

export class ContentValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'content.validation_error' });
  }
}

export class FailedToCreateContentError extends AppError {
  constructor(message: string) {
    super(message, 500, { code: 'content.creation_failed' });
  }
}
