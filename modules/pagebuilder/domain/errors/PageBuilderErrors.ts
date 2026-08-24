/**
 * Page Builder Domain Errors
 */

import { AppError } from '../../../../libs/errors';

export class PageDraftNotFoundError extends AppError {
  constructor(draftId: string) {
    super(`Page draft '${draftId}' not found`, 404, { code: 'PAGE_DRAFT_NOT_FOUND' });
  }
}

export class PageDraftValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'PAGE_DRAFT_VALIDATION_ERROR' });
  }
}

export class BlockNotFoundError extends AppError {
  constructor(blockId: string) {
    super(`Block '${blockId}' not found in draft`, 404, { code: 'BLOCK_NOT_FOUND' });
  }
}

export class BlockTypeNotRegisteredError extends AppError {
  constructor(typeId: string) {
    super(`Block type '${typeId}' is not registered`, 400, { code: 'BLOCK_TYPE_NOT_REGISTERED' });
  }
}

export class BlockTypeAlreadyRegisteredError extends AppError {
  constructor(typeId: string) {
    super(`Block type '${typeId}' is already registered`, 409, { code: 'BLOCK_TYPE_ALREADY_REGISTERED' });
  }
}

export class BlockPlacementError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'BLOCK_PLACEMENT_ERROR' });
  }
}

export class DraftAlreadyPublishedError extends AppError {
  constructor(draftId: string) {
    super(`Draft '${draftId}' is already published`, 409, { code: 'DRAFT_ALREADY_PUBLISHED' });
  }
}

export class DraftNotReadyToPublishError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'DRAFT_NOT_READY' });
  }
}
