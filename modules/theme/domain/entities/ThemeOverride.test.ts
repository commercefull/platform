/**
 * ThemeOverride Entity Tests
 */

import { ThemeOverride } from './ThemeOverride';

describe('ThemeOverride', () => {
  const baseProps = {
    overrideId: 'ovr_1',
    storeId: 'store_1',
    themeId: 'theme_1',
    organizationId: 'org_1',
  };

  it('should create with defaults', () => {
    const override = ThemeOverride.create(baseProps);

    expect(override.overrideId).toBe('ovr_1');
    expect(override.storeId).toBe('store_1');
    expect(override.themeId).toBe('theme_1');
    expect(override.isActive).toBe(true);
    expect(override.settings).toEqual({});
  });

  it('should create with settings', () => {
    const override = ThemeOverride.create({
      ...baseProps,
      settings: { primaryColor: '#ff0000' },
      customCss: 'body { margin: 0; }',
      customLogoUrl: '/logo.png',
    });

    expect(override.settings.primaryColor).toBe('#ff0000');
    expect(override.customCss).toBe('body { margin: 0; }');
    expect(override.customLogoUrl).toBe('/logo.png');
  });

  it('should reconstitute from props', () => {
    const now = new Date();
    const override = ThemeOverride.reconstitute({
      ...baseProps,
      settings: { bg: '#000' },
      customCss: '.x {}',
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });

    expect(override.isActive).toBe(false);
    expect(override.settings.bg).toBe('#000');
  });

  it('should activate and deactivate', () => {
    const override = ThemeOverride.create(baseProps);
    override.deactivate();
    expect(override.isActive).toBe(false);
    override.activate();
    expect(override.isActive).toBe(true);
  });

  it('should update a single setting', () => {
    const override = ThemeOverride.create(baseProps);
    override.updateSetting('primaryColor', '#ff0000');
    expect(override.settings.primaryColor).toBe('#ff0000');
  });

  it('should reject empty setting key', () => {
    const override = ThemeOverride.create(baseProps);
    expect(() => override.updateSetting('', 'value')).toThrow('Setting key cannot be empty');
  });

  it('should update multiple settings', () => {
    const override = ThemeOverride.create(baseProps);
    override.updateSettings({ primaryColor: '#ff0000', bgColor: '#f0f0f0' });
    expect(override.settings.primaryColor).toBe('#ff0000');
    expect(override.settings.bgColor).toBe('#f0f0f0');
  });

  it('should remove a setting', () => {
    const override = ThemeOverride.create({
      ...baseProps,
      settings: { primaryColor: '#ff0000', bgColor: '#ffffff' },
    });
    override.removeSetting('primaryColor');
    expect(override.settings.primaryColor).toBeUndefined();
    expect(override.settings.bgColor).toBe('#ffffff');
  });

  it('should clear all settings', () => {
    const override = ThemeOverride.create({
      ...baseProps,
      settings: { primaryColor: '#ff0000' },
    });
    override.clearSettings();
    expect(override.settings).toEqual({});
  });

  it('should update custom CSS', () => {
    const override = ThemeOverride.create(baseProps);
    override.updateCustomCss('body { padding: 0; }');
    expect(override.customCss).toBe('body { padding: 0; }');
  });

  it('should add and remove head tags', () => {
    const override = ThemeOverride.create(baseProps);
    override.addHeadTag('<meta name="x" content="y">');
    expect(override.customHeadTags).toHaveLength(1);

    override.addHeadTag('<meta name="x" content="y">'); // duplicate
    expect(override.customHeadTags).toHaveLength(1);

    override.removeHeadTag('<meta name="x" content="y">');
    expect(override.customHeadTags).toHaveLength(0);
  });

  it('should update body attributes', () => {
    const override = ThemeOverride.create(baseProps);
    override.updateBodyAttributes({ 'data-theme': 'dark' });
    expect(override.customBodyAttributes?.['data-theme']).toBe('dark');
  });

  it('should serialize to JSON', () => {
    const override = ThemeOverride.create({
      ...baseProps,
      settings: { primaryColor: '#ff0000' },
      customCss: '.x {}',
    });
    const json = override.toJSON() as Record<string, unknown>;

    expect(json.overrideId).toBe('ovr_1');
    expect(json.storeId).toBe('store_1');
    expect(json.isActive).toBe(true);
    expect(json.settings).toEqual({ primaryColor: '#ff0000' });
  });
});
