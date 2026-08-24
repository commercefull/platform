/**
 * Theme Registry Tests
 */

import { ThemeRegistry } from './ThemeRegistry';
import { Theme } from '../entities/Theme';
import { ThemeOverride } from '../entities/ThemeOverride';
import { ThemeRepository } from '../repositories/ThemeRepository';

class MockThemeRepository implements ThemeRepository {
  private themes = new Map<string, Theme>();
  private overrides = new Map<string, ThemeOverride>();
  private assignments = new Map<string, { themeId: string; overrideId?: string }>();

  async findById(themeId: string): Promise<Theme | null> { return this.themes.get(themeId) ?? null; }
  async findBySlug(slug: string): Promise<Theme | null> {
    for (const t of this.themes.values()) { if (t.slug === slug) return t; }
    return null;
  }
  async findAll(): Promise<Theme[]> { return Array.from(this.themes.values()); }
  async findActive(): Promise<Theme[]> { return Array.from(this.themes.values()).filter(t => t.isActive()); }
  async findBuiltIn(): Promise<Theme[]> { return Array.from(this.themes.values()).filter(t => t.isBuiltIn()); }
  async save(theme: Theme): Promise<Theme> { this.themes.set(theme.themeId, theme); return theme; }
  async delete(themeId: string): Promise<boolean> { return this.themes.delete(themeId); }

  async findOverrideByStore(storeId: string): Promise<ThemeOverride | null> {
    for (const o of this.overrides.values()) { if (o.storeId === storeId && o.isActive) return o; }
    return null;
  }
  async findOverrideById(overrideId: string): Promise<ThemeOverride | null> { return this.overrides.get(overrideId) ?? null; }
  async findOverridesByTheme(themeId: string): Promise<ThemeOverride[]> {
    return Array.from(this.overrides.values()).filter(o => o.themeId === themeId);
  }
  async findOverridesByOrganization(organizationId: string): Promise<ThemeOverride[]> {
    return Array.from(this.overrides.values()).filter(o => o.organizationId === organizationId);
  }
  async saveOverride(override: ThemeOverride): Promise<ThemeOverride> { this.overrides.set(override.overrideId, override); return override; }
  async deleteOverride(overrideId: string): Promise<boolean> { return this.overrides.delete(overrideId); }

  async findThemeAssignment(storeId: string): Promise<{ themeId: string; overrideId?: string } | null> {
    return this.assignments.get(storeId) ?? null;
  }
  async assignThemeToStore(storeId: string, themeId: string, _organizationId: string): Promise<void> {
    this.assignments.set(storeId, { themeId });
  }
  async unassignThemeFromStore(storeId: string): Promise<boolean> { return this.assignments.delete(storeId); }
}

function createTestTheme(): Theme {
  return Theme.create({
    themeId: 'theme_test',
    slug: 'test-theme',
    name: 'Test Theme',
    type: 'custom',
    settingsSchema: {
      groups: [
        {
          groupId: 'colors',
          label: 'Colors',
          settings: [
            { key: 'primaryColor', label: 'Primary', type: 'color', defaultValue: '#007bff', cssVariable: '--color-primary' },
            { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', cssVariable: '--color-bg' },
          ],
        },
      ],
    },
    defaultSettings: { primaryColor: '#007bff', bgColor: '#ffffff' },
    layout: { regions: ['header', 'main', 'footer'], pageLayouts: [] },
    components: { components: [] },
  });
}

describe('ThemeRegistry', () => {
  let registry: ThemeRegistry;
  let repo: MockThemeRepository;

  beforeEach(() => {
    registry = new ThemeRegistry();
    repo = new MockThemeRepository();
  });

  it('should register built-in themes', () => {
    registry.registerBuiltInThemes();
    const themes = registry.listThemes();

    expect(themes.length).toBe(3);
    expect(themes.some(t => t.slug === 'default')).toBe(true);
    expect(themes.some(t => t.slug === 'minimal')).toBe(true);
    expect(themes.some(t => t.slug === 'boutique')).toBe(true);
  });

  it('should register built-in themes only once', () => {
    registry.registerBuiltInThemes();
    registry.registerBuiltInThemes();
    expect(registry.listThemes().length).toBe(3);
  });

  it('should get theme by ID', () => {
    registry.registerBuiltInThemes();
    const theme = registry.getTheme('theme_builtin_default');
    expect(theme).toBeDefined();
    expect(theme?.slug).toBe('default');
  });

  it('should get theme by slug', () => {
    registry.registerBuiltInThemes();
    const theme = registry.getThemeBySlug('minimal');
    expect(theme).toBeDefined();
    expect(theme?.name).toBe('Minimal');
  });

  it('should list active themes', () => {
    registry.registerBuiltInThemes();
    const active = registry.listActiveThemes();
    expect(active.length).toBe(3);
    expect(active.every(t => t.isActive())).toBe(true);
  });

  it('should list built-in themes', () => {
    registry.registerBuiltInThemes();
    const builtIn = registry.listBuiltInThemes();
    expect(builtIn.length).toBe(3);
    expect(builtIn.every(t => t.isBuiltIn())).toBe(true);
  });

  it('should register and unregister custom themes', () => {
    const theme = createTestTheme();
    theme.activate();
    registry.registerTheme(theme);
    expect(registry.getTheme('theme_test')).toBeDefined();

    registry.unregisterTheme('theme_test');
    expect(registry.getTheme('theme_test')).toBeUndefined();
  });

  it('should not unregister built-in themes', () => {
    registry.registerBuiltInThemes();
    registry.unregisterTheme('theme_builtin_default');
    expect(registry.getTheme('theme_builtin_default')).toBeDefined();
  });

  it('should resolve theme for store without override', async () => {
    const theme = createTestTheme();
    theme.activate();
    registry.registerTheme(theme);
    await repo.save(theme);
    await repo.assignThemeToStore('store_1', 'theme_test', 'org_1');

    const resolved = await registry.resolveThemeForStore('store_1', repo);

    expect(resolved).not.toBeNull();
    expect(resolved!.theme.themeId).toBe('theme_test');
    expect(resolved!.settings.primaryColor).toBe('#007bff');
    expect(resolved!.settings.bgColor).toBe('#ffffff');
    expect(resolved!.override).toBeUndefined();
  });

  it('should resolve theme for store with override', async () => {
    const theme = createTestTheme();
    theme.activate();
    registry.registerTheme(theme);
    await repo.save(theme);
    await repo.assignThemeToStore('store_1', 'theme_test', 'org_1');

    const override = ThemeOverride.create({
      overrideId: 'ovr_1',
      storeId: 'store_1',
      themeId: 'theme_test',
      organizationId: 'org_1',
      settings: { primaryColor: '#ff0000' },
      customCss: 'body { margin: 0; }',
      customLogoUrl: '/custom-logo.png',
    });
    await repo.saveOverride(override);

    const resolved = await registry.resolveThemeForStore('store_1', repo);

    expect(resolved).not.toBeNull();
    expect(resolved!.settings.primaryColor).toBe('#ff0000');
    expect(resolved!.settings.bgColor).toBe('#ffffff');
    expect(resolved!.override).toBeDefined();
    expect(resolved!.customCss).toBe('body { margin: 0; }');
    expect(resolved!.customLogoUrl).toBe('/custom-logo.png');
  });

  it('should return null for unassigned store', async () => {
    const resolved = await registry.resolveThemeForStore('nonexistent', repo);
    expect(resolved).toBeNull();
  });

  it('should generate CSS from resolved theme', async () => {
    const theme = createTestTheme();
    theme.activate();
    registry.registerTheme(theme);
    await repo.save(theme);
    await repo.assignThemeToStore('store_1', 'theme_test', 'org_1');

    const override = ThemeOverride.create({
      overrideId: 'ovr_1',
      storeId: 'store_1',
      themeId: 'theme_test',
      organizationId: 'org_1',
      settings: { primaryColor: '#ff0000' },
      customCss: 'body { padding: 0; }',
    });
    await repo.saveOverride(override);

    const resolved = await registry.resolveThemeForStore('store_1', repo);
    const css = registry.generateCSS(resolved!);

    expect(css).toContain('--color-primary: #ff0000');
    expect(css).toContain('--color-bg: #ffffff');
    expect(css).toContain('body { padding: 0; }');
  });

  it('should generate head tags for boutique theme fonts', async () => {
    registry.registerBuiltInThemes();
    const boutique = registry.getThemeBySlug('boutique')!;
    await repo.save(boutique);
    await repo.assignThemeToStore('store_1', boutique.themeId, 'org_1');

    const resolved = await registry.resolveThemeForStore('store_1', repo);
    const tags = registry.generateHeadTags(resolved!);

    expect(tags.some(t => t.includes('Playfair'))).toBe(true);
    expect(tags.some(t => t.includes('Lato'))).toBe(true);
  });

  it('should generate body attributes', async () => {
    const theme = createTestTheme();
    theme.activate();
    registry.registerTheme(theme);
    await repo.save(theme);
    await repo.assignThemeToStore('store_1', 'theme_test', 'org_1');

    const override = ThemeOverride.create({
      overrideId: 'ovr_1',
      storeId: 'store_1',
      themeId: 'theme_test',
      organizationId: 'org_1',
      customBodyAttributes: { 'data-layout': 'boxed' },
    });
    await repo.saveOverride(override);

    const resolved = await registry.resolveThemeForStore('store_1', repo);
    const attrs = registry.generateBodyAttributes(resolved!);

    expect(attrs['data-theme']).toBe('test-theme');
    expect(attrs['data-layout']).toBe('boxed');
  });

  it('should ensure theme is loaded from repository', async () => {
    const theme = createTestTheme();
    theme.activate();
    await repo.save(theme);

    const loaded = await registry.ensureThemeLoaded('theme_test', repo);
    expect(loaded.themeId).toBe('theme_test');
    expect(registry.getTheme('theme_test')).toBeDefined();
  });
});
