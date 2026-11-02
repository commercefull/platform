/**
 * Built-in Themes
 *
 * Ships with 3 themes: default, minimal, boutique.
 * These are registered at boot time and cannot be deleted.
 */

import { Theme } from './entities/Theme';
import { createDefaultTheme } from './themes/defaultTheme';
import { createMinimalTheme } from './themes/minimalTheme';
import { createBoutiqueTheme } from './themes/boutiqueTheme';

export function createBuiltInThemes(): Theme[] {
  return [createDefaultTheme(), createMinimalTheme(), createBoutiqueTheme()];
}
