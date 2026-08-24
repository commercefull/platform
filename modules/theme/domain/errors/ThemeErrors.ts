/**
 * Theme Domain Errors
 */

import { AppError } from '../../../../libs/errors';

export class ThemeNotFoundError extends AppError {
  constructor(themeId: string) {
    super(`Theme not found: ${themeId}`, 404, { code: 'theme.not_found' });
  }
}

export class ThemeAlreadyExistsError extends AppError {
  constructor(slug: string) {
    super(`Theme with slug '${slug}' already exists`, 409, { code: 'theme.already_exists' });
  }
}

export class ThemeValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'theme.validation_error' });
  }
}

export class ThemeNotActiveError extends AppError {
  constructor(slug: string) {
    super(`Theme '${slug}' is not active`, 400, { code: 'theme.not_active' });
  }
}

export class ThemeOverrideNotFoundError extends AppError {
  constructor(overrideId: string) {
    super(`Theme override not found: ${overrideId}`, 404, { code: 'theme.override_not_found' });
  }
}

export class ThemeOverrideValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'theme.override_validation_error' });
  }
}

export class ThemeAssignmentNotFoundError extends AppError {
  constructor(storeId: string) {
    super(`No theme assignment found for store: ${storeId}`, 404, { code: 'theme.assignment_not_found' });
  }
}

export class BuiltInThemeCannotBeDeletedError extends AppError {
  constructor(slug: string) {
    super(`Built-in theme '${slug}' cannot be deleted`, 400, { code: 'theme.builtin_cannot_delete' });
  }
}
