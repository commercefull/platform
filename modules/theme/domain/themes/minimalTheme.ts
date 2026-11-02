import { Theme, ThemeSettingsSchema } from '../entities/Theme';

const SETTINGS_SCHEMA: ThemeSettingsSchema = {
  groups: [
    {
      groupId: 'colors',
      label: 'Colors',
      settings: [
        { key: 'primaryColor', label: 'Primary Color', type: 'color', defaultValue: '#000000', cssVariable: '--color-primary' },
        { key: 'secondaryColor', label: 'Secondary Color', type: 'color', defaultValue: '#666666', cssVariable: '--color-secondary' },
        { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#000000', cssVariable: '--color-accent' },
        { key: 'backgroundColor', label: 'Background Color', type: 'color', defaultValue: '#ffffff', cssVariable: '--color-bg' },
        { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1a1a1a', cssVariable: '--color-text' },
        { key: 'headerBgColor', label: 'Header Background', type: 'color', defaultValue: '#ffffff', cssVariable: '--color-header-bg' },
        { key: 'footerBgColor', label: 'Footer Background', type: 'color', defaultValue: '#ffffff', cssVariable: '--color-footer-bg' },
      ],
    },
    {
      groupId: 'typography',
      label: 'Typography',
      settings: [
        {
          key: 'headingFont',
          label: 'Heading Font',
          type: 'font',
          defaultValue: 'system-ui, sans-serif',
          cssVariable: '--font-heading',
        },
        { key: 'bodyFont', label: 'Body Font', type: 'font', defaultValue: 'system-ui, sans-serif', cssVariable: '--font-body' },
        {
          key: 'baseFontSize',
          label: 'Base Font Size',
          type: 'range',
          defaultValue: 16,
          min: 12,
          max: 20,
          step: 1,
          cssVariable: '--font-size-base',
        },
      ],
    },
    {
      groupId: 'layout',
      label: 'Layout',
      settings: [
        {
          key: 'containerMaxWidth',
          label: 'Container Max Width',
          type: 'select',
          defaultValue: '1024px',
          options: [
            { label: '768px', value: '768px' },
            { label: '1024px', value: '1024px' },
            { label: '1280px', value: '1280px' },
            { label: 'Full Width', value: '100%' },
          ],
          cssVariable: '--container-max-width',
        },
        { key: 'showSidebar', label: 'Show Sidebar', type: 'checkbox', defaultValue: false },
        { key: 'productsPerRow', label: 'Products Per Row', type: 'range', defaultValue: 3, min: 2, max: 6, step: 1 },
      ],
    },
    {
      groupId: 'header',
      label: 'Header',
      settings: [
        { key: 'showSearchBar', label: 'Show Search Bar', type: 'checkbox', defaultValue: true },
        { key: 'showCategories', label: 'Show Categories Nav', type: 'checkbox', defaultValue: false },
        { key: 'stickyHeader', label: 'Sticky Header', type: 'checkbox', defaultValue: false },
        {
          key: 'headerHeight',
          label: 'Header Height',
          type: 'range',
          defaultValue: 56,
          min: 48,
          max: 96,
          step: 4,
          cssVariable: '--header-height',
        },
      ],
    },
    {
      groupId: 'product',
      label: 'Product Cards',
      settings: [
        { key: 'showQuickView', label: 'Show Quick View Button', type: 'checkbox', defaultValue: false },
        { key: 'showWishlistButton', label: 'Show Wishlist Button', type: 'checkbox', defaultValue: false },
        { key: 'showCompareButton', label: 'Show Compare Button', type: 'checkbox', defaultValue: false },
        { key: 'showRating', label: 'Show Rating', type: 'checkbox', defaultValue: true },
        { key: 'showBadges', label: 'Show Sale/New Badges', type: 'checkbox', defaultValue: false },
        {
          key: 'cardBorderRadius',
          label: 'Card Border Radius',
          type: 'range',
          defaultValue: 0,
          min: 0,
          max: 24,
          step: 2,
          cssVariable: '--card-border-radius',
        },
      ],
    },
  ],
};

export function createMinimalTheme(): Theme {
  return Theme.create({
    themeId: '0198b000-0000-7000-8000-000000000002',
    slug: 'minimal',
    name: 'Minimal',
    description: 'Distraction-free minimalist design. Focus on products with lots of whitespace.',
    version: '1.0.0',
    type: 'built_in',
    author: 'Commercefull',
    screenshotUrl: '/themes/minimal/screenshot.png',
    previewUrl: '/themes/minimal/preview',
    tags: ['minimal', 'clean', 'whitespace', 'modern'],
    isCustomizable: true,
    settingsSchema: SETTINGS_SCHEMA,
    defaultSettings: {
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#1a1a1a',
      headerBgColor: '#ffffff',
      footerBgColor: '#ffffff',
      headingFont: 'system-ui, sans-serif',
      bodyFont: 'system-ui, sans-serif',
      baseFontSize: 16,
      containerMaxWidth: '1024px',
      showSidebar: false,
      productsPerRow: 3,
      showSearchBar: true,
      showCategories: false,
      stickyHeader: false,
      headerHeight: 56,
      showQuickView: false,
      showWishlistButton: false,
      showCompareButton: false,
      showRating: true,
      showBadges: false,
      cardBorderRadius: 0,
    },
    layout: {
      regions: ['header', 'main', 'footer'],
      pageLayouts: [
        {
          pageType: 'home',
          regions: [
            { region: 'header', component: 'Header' },
            { region: 'main', component: 'HomePage' },
            { region: 'footer', component: 'Footer' },
          ],
        },
        {
          pageType: 'product',
          regions: [
            { region: 'header', component: 'Header' },
            { region: 'main', component: 'ProductPage' },
            { region: 'footer', component: 'Footer' },
          ],
        },
        {
          pageType: 'category',
          regions: [
            { region: 'header', component: 'Header' },
            { region: 'main', component: 'CategoryPage' },
            { region: 'footer', component: 'Footer' },
          ],
        },
        {
          pageType: 'cart',
          regions: [
            { region: 'header', component: 'Header' },
            { region: 'main', component: 'CartPage' },
            { region: 'footer', component: 'Footer' },
          ],
        },
        {
          pageType: 'checkout',
          regions: [
            { region: 'header', component: 'Header' },
            { region: 'main', component: 'CheckoutPage' },
            { region: 'footer', component: 'Footer' },
          ],
        },
      ],
    },
    components: {
      components: [
        { name: 'Header', path: 'components/Header.tsx' },
        { name: 'Footer', path: 'components/Footer.tsx' },
        { name: 'HomePage', path: 'pages/HomePage.tsx' },
        { name: 'ProductPage', path: 'pages/ProductPage.tsx' },
        { name: 'CategoryPage', path: 'pages/CategoryPage.tsx' },
        { name: 'CartPage', path: 'pages/CartPage.tsx' },
        { name: 'CheckoutPage', path: 'pages/CheckoutPage.tsx' },
        { name: 'ProductCard', path: 'components/ProductCard.tsx' },
      ],
    },
    assets: {
      cssEntry: 'styles/main.css',
      jsEntry: 'scripts/main.ts',
    },
  });
}
