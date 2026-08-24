/**
 * Built-in Themes
 *
 * Ships with 3 themes: default, minimal, boutique.
 * These are registered at boot time and cannot be deleted.
 */

import { Theme } from './entities/Theme';

export function createBuiltInThemes(): Theme[] {
  return [
    createDefaultTheme(),
    createMinimalTheme(),
    createBoutiqueTheme(),
  ];
}

function createDefaultTheme(): Theme {
  return Theme.create({
    themeId: 'theme_builtin_default',
    slug: 'default',
    name: 'Default',
    description: 'Clean, modern storefront with full feature support. Great starting point for any store.',
    version: '1.0.0',
    type: 'built_in',
    author: 'CommerceFull',
    screenshotUrl: '/themes/default/screenshot.png',
    previewUrl: '/themes/default/preview',
    tags: ['modern', 'clean', 'responsive'],
    isCustomizable: true,
    settingsSchema: {
      groups: [
        {
          groupId: 'colors',
          label: 'Colors',
          settings: [
            { key: 'primaryColor', label: 'Primary Color', type: 'color', defaultValue: '#007bff', cssVariable: '--color-primary' },
            { key: 'secondaryColor', label: 'Secondary Color', type: 'color', defaultValue: '#6c757d', cssVariable: '--color-secondary' },
            { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#28a745', cssVariable: '--color-accent' },
            { key: 'backgroundColor', label: 'Background Color', type: 'color', defaultValue: '#ffffff', cssVariable: '--color-bg' },
            { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#212529', cssVariable: '--color-text' },
            { key: 'headerBgColor', label: 'Header Background', type: 'color', defaultValue: '#f8f9fa', cssVariable: '--color-header-bg' },
            { key: 'footerBgColor', label: 'Footer Background', type: 'color', defaultValue: '#f8f9fa', cssVariable: '--color-footer-bg' },
          ],
        },
        {
          groupId: 'typography',
          label: 'Typography',
          settings: [
            { key: 'headingFont', label: 'Heading Font', type: 'font', defaultValue: 'Inter, sans-serif', cssVariable: '--font-heading' },
            { key: 'bodyFont', label: 'Body Font', type: 'font', defaultValue: 'Inter, sans-serif', cssVariable: '--font-body' },
            { key: 'baseFontSize', label: 'Base Font Size', type: 'range', defaultValue: 16, min: 12, max: 20, step: 1, cssVariable: '--font-size-base' },
          ],
        },
        {
          groupId: 'layout',
          label: 'Layout',
          settings: [
            { key: 'containerMaxWidth', label: 'Container Max Width', type: 'select', defaultValue: '1280px', options: [
              { label: '1024px', value: '1024px' },
              { label: '1280px', value: '1280px' },
              { label: '1440px', value: '1440px' },
              { label: 'Full Width', value: '100%' },
            ], cssVariable: '--container-max-width' },
            { key: 'showSidebar', label: 'Show Sidebar', type: 'checkbox', defaultValue: true },
            { key: 'sidebarPosition', label: 'Sidebar Position', type: 'select', defaultValue: 'right', options: [
              { label: 'Left', value: 'left' },
              { label: 'Right', value: 'right' },
            ] },
            { key: 'productsPerRow', label: 'Products Per Row', type: 'range', defaultValue: 4, min: 2, max: 6, step: 1 },
          ],
        },
        {
          groupId: 'header',
          label: 'Header',
          settings: [
            { key: 'showSearchBar', label: 'Show Search Bar', type: 'checkbox', defaultValue: true },
            { key: 'showCategories', label: 'Show Categories Nav', type: 'checkbox', defaultValue: true },
            { key: 'stickyHeader', label: 'Sticky Header', type: 'checkbox', defaultValue: true },
            { key: 'headerHeight', label: 'Header Height', type: 'range', defaultValue: 64, min: 48, max: 96, step: 4, cssVariable: '--header-height' },
          ],
        },
        {
          groupId: 'product',
          label: 'Product Cards',
          settings: [
            { key: 'showQuickView', label: 'Show Quick View Button', type: 'checkbox', defaultValue: true },
            { key: 'showWishlistButton', label: 'Show Wishlist Button', type: 'checkbox', defaultValue: true },
            { key: 'showCompareButton', label: 'Show Compare Button', type: 'checkbox', defaultValue: false },
            { key: 'showRating', label: 'Show Rating', type: 'checkbox', defaultValue: true },
            { key: 'showBadges', label: 'Show Sale/New Badges', type: 'checkbox', defaultValue: true },
            { key: 'cardBorderRadius', label: 'Card Border Radius', type: 'range', defaultValue: 8, min: 0, max: 24, step: 2, cssVariable: '--card-border-radius' },
          ],
        },
      ],
    },
    defaultSettings: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      accentColor: '#28a745',
      backgroundColor: '#ffffff',
      textColor: '#212529',
      headerBgColor: '#f8f9fa',
      footerBgColor: '#f8f9fa',
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      baseFontSize: 16,
      containerMaxWidth: '1280px',
      showSidebar: true,
      sidebarPosition: 'right',
      productsPerRow: 4,
      showSearchBar: true,
      showCategories: true,
      stickyHeader: true,
      headerHeight: 64,
      showQuickView: true,
      showWishlistButton: true,
      showCompareButton: false,
      showRating: true,
      showBadges: true,
      cardBorderRadius: 8,
    },
    layout: {
      regions: ['header', 'sidebar', 'main', 'footer'],
      pageLayouts: [
        { pageType: 'home', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'HomePage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'product', regions: [
          { region: 'header', component: 'Header' },
          { region: 'sidebar', component: 'ProductFilters' },
          { region: 'main', component: 'ProductPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'category', regions: [
          { region: 'header', component: 'Header' },
          { region: 'sidebar', component: 'CategoryFilters' },
          { region: 'main', component: 'CategoryPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'cart', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'CartPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'checkout', regions: [
          { region: 'header', component: 'CheckoutHeader' },
          { region: 'main', component: 'CheckoutPage' },
          { region: 'footer', component: 'CheckoutFooter' },
        ]},
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
        { name: 'ProductFilters', path: 'components/ProductFilters.tsx' },
        { name: 'CategoryFilters', path: 'components/CategoryFilters.tsx' },
      ],
    },
    assets: {
      cssEntry: 'styles/main.css',
      jsEntry: 'scripts/main.ts',
    },
  });
}

function createMinimalTheme(): Theme {
  return Theme.create({
    themeId: 'theme_builtin_minimal',
    slug: 'minimal',
    name: 'Minimal',
    description: 'Distraction-free minimalist design. Focus on products with lots of whitespace.',
    version: '1.0.0',
    type: 'built_in',
    author: 'CommerceFull',
    screenshotUrl: '/themes/minimal/screenshot.png',
    previewUrl: '/themes/minimal/preview',
    tags: ['minimal', 'clean', 'whitespace', 'modern'],
    isCustomizable: true,
    settingsSchema: {
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
            { key: 'headingFont', label: 'Heading Font', type: 'font', defaultValue: 'system-ui, sans-serif', cssVariable: '--font-heading' },
            { key: 'bodyFont', label: 'Body Font', type: 'font', defaultValue: 'system-ui, sans-serif', cssVariable: '--font-body' },
            { key: 'baseFontSize', label: 'Base Font Size', type: 'range', defaultValue: 16, min: 12, max: 20, step: 1, cssVariable: '--font-size-base' },
          ],
        },
        {
          groupId: 'layout',
          label: 'Layout',
          settings: [
            { key: 'containerMaxWidth', label: 'Container Max Width', type: 'select', defaultValue: '1024px', options: [
              { label: '768px', value: '768px' },
              { label: '1024px', value: '1024px' },
              { label: '1280px', value: '1280px' },
              { label: 'Full Width', value: '100%' },
            ], cssVariable: '--container-max-width' },
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
            { key: 'headerHeight', label: 'Header Height', type: 'range', defaultValue: 56, min: 48, max: 96, step: 4, cssVariable: '--header-height' },
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
            { key: 'cardBorderRadius', label: 'Card Border Radius', type: 'range', defaultValue: 0, min: 0, max: 24, step: 2, cssVariable: '--card-border-radius' },
          ],
        },
      ],
    },
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
        { pageType: 'home', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'HomePage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'product', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'ProductPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'category', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'CategoryPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'cart', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'CartPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'checkout', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'CheckoutPage' },
          { region: 'footer', component: 'Footer' },
        ]},
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

function createBoutiqueTheme(): Theme {
  return Theme.create({
    themeId: 'theme_builtin_boutique',
    slug: 'boutique',
    name: 'Boutique',
    description: 'Elegant theme for fashion and lifestyle brands. Rich typography and refined aesthetics.',
    version: '1.0.0',
    type: 'built_in',
    author: 'CommerceFull',
    screenshotUrl: '/themes/boutique/screenshot.png',
    previewUrl: '/themes/boutique/preview',
    tags: ['fashion', 'elegant', 'boutique', 'lifestyle', 'premium'],
    isCustomizable: true,
    settingsSchema: {
      groups: [
        {
          groupId: 'colors',
          label: 'Colors',
          settings: [
            { key: 'primaryColor', label: 'Primary Color', type: 'color', defaultValue: '#8B5CF6', cssVariable: '--color-primary' },
            { key: 'secondaryColor', label: 'Secondary Color', type: 'color', defaultValue: '#A78BFA', cssVariable: '--color-secondary' },
            { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', cssVariable: '--color-accent' },
            { key: 'backgroundColor', label: 'Background Color', type: 'color', defaultValue: '#FAFAF9', cssVariable: '--color-bg' },
            { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1C1917', cssVariable: '--color-text' },
            { key: 'headerBgColor', label: 'Header Background', type: 'color', defaultValue: '#FFFFFF', cssVariable: '--color-header-bg' },
            { key: 'footerBgColor', label: 'Footer Background', type: 'color', defaultValue: '#1C1917', cssVariable: '--color-footer-bg' },
            { key: 'footerTextColor', label: 'Footer Text Color', type: 'color', defaultValue: '#F5F5F4', cssVariable: '--color-footer-text' },
          ],
        },
        {
          groupId: 'typography',
          label: 'Typography',
          settings: [
            { key: 'headingFont', label: 'Heading Font', type: 'font', defaultValue: 'Playfair Display, serif', cssVariable: '--font-heading' },
            { key: 'bodyFont', label: 'Body Font', type: 'font', defaultValue: 'Lato, sans-serif', cssVariable: '--font-body' },
            { key: 'baseFontSize', label: 'Base Font Size', type: 'range', defaultValue: 16, min: 12, max: 20, step: 1, cssVariable: '--font-size-base' },
            { key: 'headingWeight', label: 'Heading Weight', type: 'select', defaultValue: '600', options: [
              { label: 'Light (300)', value: '300' },
              { label: 'Regular (400)', value: '400' },
              { label: 'Medium (500)', value: '500' },
              { label: 'Semibold (600)', value: '600' },
              { label: 'Bold (700)', value: '700' },
            ], cssVariable: '--font-heading-weight' },
          ],
        },
        {
          groupId: 'layout',
          label: 'Layout',
          settings: [
            { key: 'containerMaxWidth', label: 'Container Max Width', type: 'select', defaultValue: '1280px', options: [
              { label: '1024px', value: '1024px' },
              { label: '1280px', value: '1280px' },
              { label: '1440px', value: '1440px' },
              { label: 'Full Width', value: '100%' },
            ], cssVariable: '--container-max-width' },
            { key: 'showSidebar', label: 'Show Sidebar', type: 'checkbox', defaultValue: false },
            { key: 'productsPerRow', label: 'Products Per Row', type: 'range', defaultValue: 3, min: 2, max: 5, step: 1 },
            { key: 'heroBannerEnabled', label: 'Enable Hero Banner', type: 'checkbox', defaultValue: true },
            { key: 'heroBannerHeight', label: 'Hero Banner Height', type: 'range', defaultValue: 500, min: 300, max: 800, step: 50, cssVariable: '--hero-height' },
          ],
        },
        {
          groupId: 'header',
          label: 'Header',
          settings: [
            { key: 'showSearchBar', label: 'Show Search Bar', type: 'checkbox', defaultValue: true },
            { key: 'showCategories', label: 'Show Categories Nav', type: 'checkbox', defaultValue: true },
            { key: 'stickyHeader', label: 'Sticky Header', type: 'checkbox', defaultValue: true },
            { key: 'headerHeight', label: 'Header Height', type: 'range', defaultValue: 72, min: 48, max: 120, step: 4, cssVariable: '--header-height' },
            { key: 'headerStyle', label: 'Header Style', type: 'select', defaultValue: 'centered', options: [
              { label: 'Centered Logo', value: 'centered' },
              { label: 'Left Logo', value: 'left' },
              { label: 'Split Nav', value: 'split' },
            ] },
          ],
        },
        {
          groupId: 'product',
          label: 'Product Cards',
          settings: [
            { key: 'showQuickView', label: 'Show Quick View Button', type: 'checkbox', defaultValue: true },
            { key: 'showWishlistButton', label: 'Show Wishlist Button', type: 'checkbox', defaultValue: true },
            { key: 'showCompareButton', label: 'Show Compare Button', type: 'checkbox', defaultValue: false },
            { key: 'showRating', label: 'Show Rating', type: 'checkbox', defaultValue: true },
            { key: 'showBadges', label: 'Show Sale/New Badges', type: 'checkbox', defaultValue: true },
            { key: 'cardBorderRadius', label: 'Card Border Radius', type: 'range', defaultValue: 12, min: 0, max: 24, step: 2, cssVariable: '--card-border-radius' },
            { key: 'cardShadow', label: 'Card Shadow', type: 'select', defaultValue: 'medium', options: [
              { label: 'None', value: 'none' },
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' },
            ], cssVariable: '--card-shadow' },
            { key: 'hoverEffect', label: 'Hover Effect', type: 'select', defaultValue: 'lift', options: [
              { label: 'None', value: 'none' },
              { label: 'Lift', value: 'lift' },
              { label: 'Zoom', value: 'zoom' },
              { label: 'Glow', value: 'glow' },
            ] },
          ],
        },
      ],
    },
    defaultSettings: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#A78BFA',
      accentColor: '#F59E0B',
      backgroundColor: '#FAFAF9',
      textColor: '#1C1917',
      headerBgColor: '#FFFFFF',
      footerBgColor: '#1C1917',
      footerTextColor: '#F5F5F4',
      headingFont: 'Playfair Display, serif',
      bodyFont: 'Lato, sans-serif',
      baseFontSize: 16,
      headingWeight: '600',
      containerMaxWidth: '1280px',
      showSidebar: false,
      productsPerRow: 3,
      heroBannerEnabled: true,
      heroBannerHeight: 500,
      showSearchBar: true,
      showCategories: true,
      stickyHeader: true,
      headerHeight: 72,
      headerStyle: 'centered',
      showQuickView: true,
      showWishlistButton: true,
      showCompareButton: false,
      showRating: true,
      showBadges: true,
      cardBorderRadius: 12,
      cardShadow: 'medium',
      hoverEffect: 'lift',
    },
    layout: {
      regions: ['header', 'main', 'footer'],
      pageLayouts: [
        { pageType: 'home', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'HomePage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'product', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'ProductPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'category', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'CategoryPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'cart', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'CartPage' },
          { region: 'footer', component: 'Footer' },
        ]},
        { pageType: 'checkout', regions: [
          { region: 'header', component: 'Header' },
          { region: 'main', component: 'CheckoutPage' },
          { region: 'footer', component: 'Footer' },
        ]},
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
        { name: 'HeroBanner', path: 'components/HeroBanner.tsx' },
      ],
    },
    assets: {
      cssEntry: 'styles/main.css',
      jsEntry: 'scripts/main.ts',
    },
  });
}
