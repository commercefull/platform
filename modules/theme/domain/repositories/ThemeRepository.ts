/**
 * Theme Repository Port
 *
 * Provides access to theme and theme override persistence.
 */

import { Theme } from '../entities/Theme';
import { ThemeOverride } from '../entities/ThemeOverride';

export interface ThemeRepository {
  // Theme CRUD
  findById(themeId: string): Promise<Theme | null>;
  findBySlug(slug: string): Promise<Theme | null>;
  findAll(filters?: { status?: string; type?: string; tags?: string[]; organizationId?: string }): Promise<Theme[]>;
  findActive(): Promise<Theme[]>;
  findBuiltIn(): Promise<Theme[]>;
  save(theme: Theme): Promise<Theme>;
  delete(themeId: string): Promise<boolean>;

  // Theme override CRUD
  findOverrideByStore(storeId: string): Promise<ThemeOverride | null>;
  findOverrideById(overrideId: string): Promise<ThemeOverride | null>;
  findOverridesByTheme(themeId: string): Promise<ThemeOverride[]>;
  findOverridesByOrganization(organizationId: string): Promise<ThemeOverride[]>;
  saveOverride(override: ThemeOverride): Promise<ThemeOverride>;
  deleteOverride(overrideId: string): Promise<boolean>;

  // Theme assignment (which theme is assigned to which store)
  findThemeAssignment(storeId: string): Promise<{ themeId: string; overrideId?: string } | null>;
  assignThemeToStore(storeId: string, themeId: string, organizationId: string): Promise<void>;
  unassignThemeFromStore(storeId: string): Promise<boolean>;
}
