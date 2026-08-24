/**
 * Theme Entity Tests
 */

import { Theme } from './Theme';

describe('Theme', () => {
  const baseProps = {
    themeId: 'theme_1',
    slug: 'my-theme',
    name: 'My Theme',
    settingsSchema: {
      groups: [
        {
          groupId: 'colors',
          label: 'Colors',
          settings: [
            { key: 'primaryColor', label: 'Primary', type: 'color' as const, defaultValue: '#007bff', cssVariable: '--color-primary' },
            { key: 'bgColor', label: 'Background', type: 'color' as const, defaultValue: '#ffffff', cssVariable: '--color-bg' },
          ],
        },
        {
          groupId: 'layout',
          label: 'Layout',
          settings: [
            { key: 'containerWidth', label: 'Container Width', type: 'select' as const, defaultValue: '1280px', options: [
              { label: '1024px', value: '1024px' },
              { label: '1280px', value: '1280px' },
            ] },
            { key: 'showSidebar', label: 'Show Sidebar', type: 'checkbox' as const, defaultValue: true },
          ],
        },
      ],
    },
    defaultSettings: {
      primaryColor: '#007bff',
      bgColor: '#ffffff',
      containerWidth: '1280px',
      showSidebar: true,
    },
    layout: {
      regions: ['header', 'main', 'footer'],
      pageLayouts: [
        { pageType: 'home', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'HomePage' },
          { region: 'footer', component: 'Footer' },
        ]},
      ],
    },
    components: {
      components: [
        { name: 'Header', path: 'components/Header.tsx' },
        { name: 'Footer', path: 'components/Footer.tsx' },
      ],
    },
  };

  it('should create a theme with default values', () => {
    const theme = Theme.create(baseProps);

    expect(theme.themeId).toBe('theme_1');
    expect(theme.slug).toBe('my-theme');
    expect(theme.name).toBe('My Theme');
    expect(theme.version).toBe('1.0.0');
    expect(theme.type).toBe('custom');
    expect(theme.status).toBe('draft');
    expect(theme.tags).toEqual([]);
    expect(theme.isCustomizable).toBe(true);
  });

  it('should create a built-in theme', () => {
    const theme = Theme.create({ ...baseProps, type: 'built_in' });
    expect(theme.type).toBe('built_in');
    expect(theme.isBuiltIn()).toBe(true);
  });

  it('should reject empty slug', () => {
    expect(() => Theme.create({ ...baseProps, slug: '' })).toThrow('Theme slug cannot be empty');
  });

  it('should reject invalid slug format', () => {
    expect(() => Theme.create({ ...baseProps, slug: 'My Theme!' })).toThrow('lowercase alphanumeric with dashes');
    expect(() => Theme.create({ ...baseProps, slug: 'UPPER' })).toThrow('lowercase alphanumeric with dashes');
  });

  it('should reject empty name', () => {
    expect(() => Theme.create({ ...baseProps, name: '' })).toThrow('Theme name cannot be empty');
  });

  it('should reconstitute from props', () => {
    const now = new Date();
    const theme = Theme.reconstitute({
      ...baseProps,
      version: '2.0.0',
      type: 'built_in',
      status: 'active',
      tags: ['modern', 'clean'],
      isCustomizable: false,
      assets: { cssEntry: 'styles/main.css' },
      createdAt: now,
      updatedAt: now,
    });

    expect(theme.version).toBe('2.0.0');
    expect(theme.type).toBe('built_in');
    expect(theme.status).toBe('active');
    expect(theme.tags).toEqual(['modern', 'clean']);
    expect(theme.isCustomizable).toBe(false);
    expect(theme.isActive()).toBe(true);
  });

  it('should activate and archive', () => {
    const theme = Theme.create(baseProps);
    expect(theme.status).toBe('draft');

    theme.activate();
    expect(theme.status).toBe('active');
    expect(theme.isActive()).toBe(true);

    theme.archive();
    expect(theme.status).toBe('archived');
    expect(theme.isActive()).toBe(false);
  });

  it('should update name', () => {
    const theme = Theme.create(baseProps);
    theme.updateName('New Name');
    expect(theme.name).toBe('New Name');
  });

  it('should reject empty name on update', () => {
    const theme = Theme.create(baseProps);
    expect(() => theme.updateName('')).toThrow('Theme name cannot be empty');
  });

  it('should add and remove tags', () => {
    const theme = Theme.create(baseProps);

    theme.addTag('Fashion');
    theme.addTag('modern');
    expect(theme.tags).toContain('fashion');
    expect(theme.tags).toContain('modern');
    expect(theme.hasTag('fashion')).toBe(true);

    theme.removeTag('fashion');
    expect(theme.tags).not.toContain('fashion');
    expect(theme.hasTag('fashion')).toBe(false);
  });

  it('should not add duplicate tags', () => {
    const theme = Theme.create(baseProps);
    theme.addTag('modern');
    theme.addTag('modern');
    expect(theme.tags.filter(t => t === 'modern')).toHaveLength(1);
  });

  it('should update default settings', () => {
    const theme = Theme.create(baseProps);
    theme.updateDefaultSettings({ primaryColor: '#ff0000' });
    expect(theme.defaultSettings.primaryColor).toBe('#ff0000');
    // Other settings should be preserved
    expect(theme.defaultSettings.bgColor).toBe('#ffffff');
  });

  it('should resolve settings with overrides', () => {
    const theme = Theme.create(baseProps);
    const resolved = theme.resolveSettings({ primaryColor: '#ff0000', showSidebar: false });

    expect(resolved.primaryColor).toBe('#ff0000');
    expect(resolved.showSidebar).toBe(false);
    expect(resolved.bgColor).toBe('#ffffff');
    expect(resolved.containerWidth).toBe('1280px');
  });

  it('should get setting value with fallback', () => {
    const theme = Theme.create(baseProps);

    expect(theme.getSettingValue('primaryColor')).toBe('#007bff');
    expect(theme.getSettingValue('primaryColor', { primaryColor: '#ff0000' })).toBe('#ff0000');
    expect(theme.getSettingValue('nonexistent')).toBe('');
  });

  it('should generate CSS variables', () => {
    const theme = Theme.create(baseProps);
    const cssVars = theme.toCSSVariables({ primaryColor: '#ff0000' });

    expect(cssVars['--color-primary']).toBe('#ff0000');
    expect(cssVars['--color-bg']).toBe('#ffffff');
  });

  it('should serialize to JSON', () => {
    const theme = Theme.create(baseProps);
    const json = theme.toJSON() as Record<string, unknown>;

    expect(json.themeId).toBe('theme_1');
    expect(json.slug).toBe('my-theme');
    expect(json.name).toBe('My Theme');
    expect(json.status).toBe('draft');
    expect(json.settingsSchema).toBeDefined();
    expect(json.layout).toBeDefined();
  });
});
