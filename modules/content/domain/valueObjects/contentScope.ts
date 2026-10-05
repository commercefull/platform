/**
 * Content scope matching for store/channel/locale-targeted content.
 *
 * `conditions` is the free-form JSON stored on contentBlock.conditions and
 * contentNavigationItem.conditions. Scope keys:
 *   - storeIds:   string[] — item applies only to these stores
 *   - channelIds: string[] — item applies only to these sales channels
 *   - locales:    string[] — item applies only to these locales
 * A missing or empty array means "applies to all" for that dimension.
 * Locale conditions match exactly (`de-DE`) or by language prefix (`de`
 * matches a `de-DE` context and vice versa).
 */

import type { ContentPublicationContext } from '../repositories/ContentRepository';

export type ContentScopeConditions = {
  storeIds?: string[];
  channelIds?: string[];
  locales?: string[];
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function localeMatches(conditionLocale: string, contextLocale: string): boolean {
  if (conditionLocale === contextLocale) return true;
  return conditionLocale.split('-')[0] === contextLocale.split('-')[0];
}

/**
 * Whether content carrying `conditions` is visible in the given context.
 * Missing context values fail only when the condition dimension is set —
 * e.g. a block scoped to `storeIds` is hidden when no store resolved.
 */
export function matchesContentScope(conditions: unknown, context: ContentPublicationContext): boolean {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return true;
  const scope = conditions as ContentScopeConditions;

  const storeIds = asStringArray(scope.storeIds);
  if (storeIds.length > 0 && (!context.storeId || !storeIds.includes(context.storeId))) return false;

  const channelIds = asStringArray(scope.channelIds);
  if (channelIds.length > 0 && (!context.channelId || !channelIds.includes(context.channelId))) return false;

  const locales = asStringArray(scope.locales);
  if (locales.length > 0 && (!context.locale || !locales.some(l => localeMatches(l, context.locale!)))) return false;

  return true;
}
