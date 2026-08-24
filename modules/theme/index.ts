/**
 * theme module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './application/wired';
export * from './domain/entities/Theme';
export * from './domain/entities/ThemeOverride';
export * from './domain/repositories/ThemeRepository';
export * from './domain/services/ThemeRegistry';
export * from './domain/errors/ThemeErrors';
export * from './domain/builtInThemes';
