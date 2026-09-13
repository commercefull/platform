# Advanced Storefront Implementation Plan — Multi-Brand Fashion, Multi-Store (UK/US)

> **Status**: Planning
> **Date**: 2026-09-13
> **Goal**: Build a production-ready, beautifully designed storefront for a multi-brand fashion merchant with separate UK and US stores, each with its own inventory, pricing, currency, and tax rules.

---

## 1. Business Context

### What we are building

A single merchant operates two regional stores:

| Store        | Region         | Currency | Tax                             | Inventory    | Language |
| ------------ | -------------- | -------- | ------------------------------- | ------------ | -------- |
| **UK Store** | United Kingdom | GBP (£)  | VAT inclusive (20%)             | UK warehouse | en-GB    |
| **US Store** | United States  | USD ($)  | Sales tax exclusive (per-state) | US warehouse | en-US    |

The merchant sells clothing from **multiple brands** (e.g. "Northwind Apparel", "Coastline Denim", "Atlas Activewear") across categories like:

- **Men**: Shirts, T-Shirts, Jeans, Trousers, Jackets, Knitwear, Underwear, Socks
- **Women**: Dresses, Tops, Jeans, Skirts, Jackets, Knitwear, Lingerie, Activewear
- **Unisex**: T-Shirts, Hoodies, Accessories
- **Accessories**: Bags, Belts, Wallets, Scarves, Hats, Sunglasses
- **Footwear**: Sneakers, Boots, Sandals, Heels

### Modules in scope

We will use **all modules except `b2b` and `marketplace`**:

`product`, `inventory`, `pricing`, `promotion`, `coupon`, `tax`, `shipping`, `checkout`, `order`, `payment`, `customer`, `basket`, `returns`, `loyalty`, `membership`, `subscription`, `notification`, `support`, `content`, `media`, `theme`, `store`, `localization`, `segment`, `fulfillment`, `warehouse`, `supplier`, `reporting`, `analytics`, `gdpr`, `compliance`, `audit`, `configuration`, `pagebuilder`, `tracking`, `webhook`, `migration`, `organization`, `integration`, `automation`

### Modules explicitly skipped

- `b2b` — not a B2B merchant
- `marketplace` — single merchant, not a multi-seller platform

---

## 2. Current State Assessment

### What exists

| Area              | Status     | Notes                                                                                            |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Storefront router | ✅ Exists  | 381 lines, ~60 routes covering PDP/PLP/search/basket/checkout/orders/wishlist/etc.               |
| Default theme     | ✅ Exists  | 54 EJS views in `web/storefront/themes/default/` using Tailwind CSS                              |
| Theme system      | ✅ Exists  | 3 built-in themes (default, minimal, boutique) with settings schema + CSS variables              |
| Theme middleware  | ✅ Exists  | Resolves theme per-store via `resolveThemeUseCase`                                               |
| Store entity      | ✅ Exists  | Supports `supportedCurrencies`, `defaultCurrency`, `settings.priceDisplayMode`, `parentStoreId`  |
| Product entity    | ✅ Exists  | Has `brandId`, `storeId`, variants with `attributes[]` (size/color/etc.)                         |
| Brand entity      | ✅ Exists  | `modules/product/domain/entities/Brand.ts` — but no repository or admin UI                       |
| Category tree     | ✅ Exists  | Depth/path-based hierarchy with `productCategory` table                                          |
| Inventory         | ✅ Exists  | `findByStoreId()` supported, store-scoped warehouses seeded                                      |
| Locale/i18n       | ✅ Exists  | 13 languages, `en-GB` and `en-US` locales available                                              |
| Seeds             | ✅ Partial | Countries, categories, sample product, stores, warehouses — but minimal and not fashion-specific |
| Storefront JS     | ✅ Minimal | Only `checkout.js`, `faq.js`, `navigation.js`                                                    |

### What's missing or needs improvement

| Gap                            | Priority | Description                                                                                                               |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Brand repository + admin       | P0       | `Brand` entity exists but has no repository, no admin CRUD, no storefront brand pages                                     |
| Fashion-specific seeds         | P0       | Current seeds are generic (1 sample product). Need brands, clothing categories, apparel products with size/color variants |
| Multi-store resolution         | P0       | No middleware resolves which store to serve based on domain/geo. `storeId` is only set if present in session              |
| Store-scoped product/inventory | P0       | PLP/PDP controllers don't filter by store. Inventory not shown per-store on PDP                                           |
| Currency switching             | P1       | No storefront currency switcher. Prices rendered in one currency                                                          |
| Advanced PLP filters           | P1       | PLP only filters by category + search. No brand/size/color/price filters                                                  |
| PDP variant selector           | P1       | PDP shows product but no interactive size/color selector that updates SKU/price/availability                              |
| Share/social                   | P1       | No social share buttons, no Open Graph tags, no Pinterest pins                                                            |
| Brand landing pages            | P1       | No `/brands/:slug` route or brand showcase pages                                                                          |
| Storefront design              | P1       | Current theme is functional but generic. Needs fashion-specific design polish                                             |
| Storefront JS interactivity    | P1       | No AJAX cart, no filter AJAX, no quick-view, no infinite scroll                                                           |
| SEO                            | P2       | No per-product meta tags, no structured data (JSON-LD), no sitemap per store                                              |
| Email templates                | P2       | No transactional email templates for order confirmation, shipping, returns                                                |

---

## 3. Epic Breakdown

### Epic A — Multi-Store Foundation (P0)

**Goal**: Resolve the correct store (UK or US) on every request and scope all data accordingly.

#### A1 — Store resolution middleware

Create `web/storefront/storeResolutionMiddleware.ts`:

- Resolve store by hostname (e.g. `uk.shop.example.com` → UK store, `us.shop.example.com` → US store)
- Fallback to geo-IP lookup (using `country` from request headers or Cloudflare header)
- Fallback to default store
- Set `req.session.storeId`, `req.session.currency`, `req.session.locale`
- Attach `res.locals.store`, `res.locals.currency`, `res.locals.locale`

**Files**:

- `web/storefront/storeResolutionMiddleware.ts` (new)
- `web/storefront/storefrontRouter.ts` (add middleware before theme resolution)

#### A2 — Store-scoped product/inventory queries

Update storefront controllers to pass `storeId` from `res.locals.store`:

- `storefrontProductController.ts` — `listProducts` filters by `storeId`
- `storefrontProductController.ts` — `getProduct` checks store-specific availability
- `storefrontCategoryController.ts` — categories filtered by store assignment
- PDP shows store-specific stock level from `inventoryRepository.findByStoreId()`

**Files**:

- `modules/product/interface/controllers/storefrontProductController.ts`
- `modules/product/interface/controllers/storefrontCategoryController.ts`
- `modules/inventory/infrastructure/repositories/InventoryRepository.ts` (verify `findByStoreId` works)

#### A3 — Currency display

- Prices rendered using `res.locals.currency` (GBP for UK, USD for US)
- `Money` formatting via `Intl.NumberFormat` with locale + currency
- Currency switcher in header (optional — defaults to store currency, allows viewing in other currency)
- Product prices fetched via `pricingRuleRepo.findActiveRules()` scoped to store currency

**Files**:

- `libs/money.ts` — add `format(locale, currency)` helper
- `web/storefront/themes/default/partials/header.ejs` — currency switcher
- `web/storefront/themes/default/partials/price.ejs` (new) — reusable price component

#### A4 — Tax display mode

- UK store: `priceDisplayMode: 'inclusive_tax'` — prices shown with VAT included
- US store: `priceDisplayMode: 'exclusive_tax'` — prices shown pre-tax, tax added at checkout
- Read from `store.settings.priceDisplayMode` in `res.locals.store.settings`

**Files**:

- `web/storefront/themes/default/partials/price.ejs` — conditional tax-inclusive display
- `modules/product/interface/controllers/storefrontProductController.ts` — pass priceDisplayMode to views

#### A5 — Store seed data

Create two stores:

```
UK Store: slug='uk', defaultCurrency='GBP', priceDisplayMode='inclusive_tax', locale='en-GB'
US Store: slug='us', defaultCurrency='USD', priceDisplayMode='exclusive_tax', locale='en-US'
```

**Files**:

- `seeds/20260913100000_seedMultiStoreData.js` (new)

---

### Epic B — Brand System (P0)

**Goal**: Full brand lifecycle — admin CRUD, repository, storefront brand pages, brand filtering.

#### B1 — Brand repository

Create the missing repository layer:

- `modules/product/infrastructure/repositories/brandRepo.ts` (new)
- `modules/product/domain/repositories/BrandRepository.ts` (new)
- Methods: `findById`, `findBySlug`, `findAll`, `findByOrganization`, `create`, `update`, `delete`, `findActive`
- Export from `modules/product/infrastructure/index.ts` barrel

#### B2 — Brand admin CRUD

- `web/admin/controllers/brandController.ts` (new)
- `web/admin/views/catalog/brands/{index,create,edit,view}.ejs` (new)
- Routes: `GET/POST /hub/catalog/brands`, `GET/POST /hub/catalog/brands/:brandId`, `DELETE /hub/catalog/brands/:brandId`
- Wire into `web/admin/adminRouters.ts`

#### B3 — Brand storefront pages

- `GET /brands` — all brands listing page
- `GET /brands/:slug` — brand landing page with featured products, brand story, logo
- `GET /brands/:slug/products` — all products from a brand (PLP filtered by brand)

**Files**:

- `modules/product/interface/controllers/storefrontBrandController.ts` (new)
- `web/storefront/themes/default/brand/index.ejs` (new)
- `web/storefront/themes/default/brand/show.ejs` (new)
- `web/storefront/storefrontRouter.ts` — add brand routes

#### B4 — Brand filter on PLP

- Add `brandId` / `brandSlug` to `ProductFilters`
- PLP sidebar shows brand filter checkboxes
- URL params: `?brand=northwind,coastline`

**Files**:

- `modules/product/domain/repositories/ProductRepository.ts` — add `brandId` to `ProductFilters`
- `modules/product/infrastructure/repositories/ProductDataRepository.ts` — implement brand filter
- `web/storefront/themes/default/product/plp.ejs` — brand filter sidebar

---

### Epic C — Fashion Catalog Seeds (P0)

**Goal**: Rich, realistic seed data for a fashion merchant.

#### C1 — Category tree seed

```
Clothing (depth 0)
├── Men (depth 1)
│   ├── Shirts
│   ├── T-Shirts
│   ├── Jeans
│   ├── Trousers
│   ├── Jackets
│   ├── Knitwear
│   ├── Underwear & Socks
├── Women (depth 1)
│   ├── Dresses
│   ├── Tops
│   ├── Jeans
│   ├── Skirts
│   ├── Jackets
│   ├── Knitwear
│   ├── Lingerie
│   ├── Activewear
├── Unisex (depth 1)
│   ├── T-Shirts
│   ├── Hoodies & Sweatshirts
├── Accessories (depth 1)
│   ├── Bags
│   ├── Belts
│   ├── Wallets
│   ├── Scarves
│   ├── Hats
│   ├── Sunglasses
├── Footwear (depth 1)
│   ├── Sneakers
│   ├── Boots
│   ├── Sandals
│   ├── Heels
```

**File**: `seeds/20260913100100_seedFashionCategories.js` (new)

#### C2 — Brand seed

Seed 5-8 fashion brands:

```
Northwind Apparel — premium menswear, UK-based
Coastline Denim — denim specialist, US-based
Atlas Activewear — performance sportswear, US-based
Verona Linen — women's linen & summer wear, Italy
Meridian Knitwear — knitwear specialist, UK-based
Foxglove Accessories — bags & leather goods, UK-based
Stride Footwear — sneakers & boots, US-based
Lumina Eyewear — sunglasses, Italy
```

**File**: `seeds/20260913100200_seedFashionBrands.js` (new)

#### C3 — Product attribute seed

Fashion-specific attributes:

```
Size (select): XS, S, M, L, XL, XXL
Colour (color): with swatch values
Material (multiselect): Cotton, Polyester, Wool, Linen, Denim, Leather, Cashmere, Viscose
Fit (select): Slim, Regular, Relaxed, Oversized
Season (select): Spring, Summer, Autumn, Winter
Gender (select): Men, Women, Unisex
Care Instructions (textarea)
```

**File**: `seeds/20260913100300_seedFashionAttributes.js` (new)

#### C4 — Product seed (30-50 products)

Generate realistic products across brands and categories:

- Each product has 3-6 variants (size × color combinations)
- Each variant has its own SKU, price, and stock level
- Products have images (use placeholder image services or local SVGs)
- Products assigned to brands and categories
- Store-specific pricing (GBP for UK, USD for US)
- Store-specific inventory (UK warehouse, US warehouse)

**File**: `seeds/20260913100400_seedFashionProducts.js` (new)

#### C5 — Inventory seed

- Stock each variant in the appropriate warehouse
- UK variants → UK warehouse
- US variants → US warehouse
- Some variants out of stock to test backorder UI

**File**: `seeds/20260913100500_seedFashionInventory.js` (new)

#### C6 — Pricing seed

- Base prices per currency
- Tier pricing for some products (buy 3+ get 10% off)
- Some sale prices (promotion-linked)

**File**: `seeds/20260913100600_seedFashionPricing.js` (new)

#### C7 — Tax seed

- UK: 20% VAT on all clothing (except children's clothing at 5%)
- US: per-state sales tax (e.g. NY 8.625%, CA 9.5%, OR 0%)

**File**: `seeds/20260913100700_seedFashionTax.js` (new)

#### C8 — Shipping seed

- UK: Royal Mail rates, DPD, free shipping over £50
- US: UPS, FedEx, USPS, free shipping over $75

**File**: `seeds/20260913100800_seedFashionShipping.js` (new)

---

### Epic D — PLP Enhancement (P1)

**Goal**: Modern product listing page with advanced filtering, sorting, and UX.

#### D1 — Advanced filter system

Add to PLP sidebar:

- **Brand filter**: checkboxes for each brand (with product counts)
- **Size filter**: size buttons/checkboxes (XS, S, M, L, XL, XXL)
- **Colour filter**: colour swatches with names
- **Price range**: min/max slider or input fields
- **Material filter**: checkboxes (Cotton, Wool, Linen, etc.)
- **Availability**: in-stock only toggle
- **Sale items**: on-sale toggle

Filters update via URL query params (server-side) with AJAX enhancement.

**Files**:

- `modules/product/domain/repositories/ProductRepository.ts` — extend `ProductFilters` with `brandId[]`, `size[]`, `color[]`, `material[]`, `onSale`
- `modules/product/infrastructure/repositories/ProductDataRepository.ts` — implement filter joins
- `modules/product/interface/controllers/storefrontProductController.ts` — parse filter params
- `web/storefront/themes/default/product/plp.ejs` — filter sidebar UI
- `public/javascripts/storefront/plp.js` (new) — AJAX filter updates

#### D2 — Sorting

- Sort by: Featured, Newest, Price (low→high), Price (high→low), Name (A-Z), Name (Z-A), Best Selling, Rating
- Persist sort preference in session

**Files**:

- `modules/product/interface/controllers/storefrontProductController.ts` — sort options
- `web/storefront/themes/default/product/plp.ejs` — sort dropdown

#### D3 — Product card redesign

- Image with hover-to-swap second image
- Quick-view button (modal)
- Add-to-cart from card (if simple product or default variant)
- Wishlist heart icon
- Sale badge / new badge / out-of-stock overlay
- Brand name link
- Price with strikethrough for sale items
- Colour swatches preview

**Files**:

- `web/storefront/themes/default/partials/product-card.ejs` (new) — reusable card
- `public/javascripts/storefront/product-card.js` (new) — quick-view modal, hover image swap

#### D4 — Grid/list toggle

- Grid view (default): 3-4 columns
- List view: full-width rows with more detail
- Toggle persisted in session/localStorage

**Files**:

- `web/storefront/themes/default/product/plp.ejs` — grid/list container
- `public/javascripts/storefront/plp.js` — toggle logic

#### D5 — Infinite scroll / load more

- Default: paginated (12 per page)
- Option: "Load More" button or infinite scroll
- Uses AJAX to fetch next page and append

**Files**:

- `public/javascripts/storefront/plp.js` — infinite scroll
- `modules/product/interface/controllers/storefrontProductController.ts` — JSON response mode for AJAX

---

### Epic E — PDP Enhancement (P1)

**Goal**: Rich product detail page with variant selection, stock, reviews, recommendations.

#### E1 — Variant selector

- Size selector (button group: XS, S, M, L, XL, XXL)
- Colour selector (swatches with names)
- Selecting a variant updates:
  - SKU display
  - Price (if variant-specific pricing)
  - Stock status ("In Stock" / "Only 3 left" / "Out of Stock")
  - Main image (if variant-specific images)
  - Add-to-cart button enabled/disabled state
- Size guide modal link

**Files**:

- `web/storefront/themes/default/product/pdp.ejs` — variant selector UI
- `public/javascripts/storefront/pdp.js` (new) — variant selection logic
- `modules/product/interface/controllers/storefrontProductController.ts` — pass variants + stock to view

#### E2 — Image gallery

- Main image with zoom-on-hover
- Thumbnail strip below
- Full-screen lightbox on click
- Variant-specific image switching
- Video support (if product has video)

**Files**:

- `web/storefront/themes/default/product/pdp.ejs` — gallery UI
- `public/javascripts/storefront/pdp.js` — gallery interactions
- `web/storefront/themes/default/partials/image-gallery.ejs` (new) — reusable gallery

#### E3 — Product information tabs

- Description (full)
- Specifications (material, fit, care, origin)
- Size & Fit guide
- Shipping & Returns
- Reviews (with rating breakdown)

**Files**:

- `web/storefront/themes/default/product/pdp.ejs` — tabbed UI
- `public/javascripts/storefront/pdp.js` — tab switching

#### E4 — Social sharing

- Share buttons: Facebook, Twitter/X, Pinterest, WhatsApp, Email, Copy Link
- Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
- Twitter Card meta tags
- Pinterest "Save" button on images

**Files**:

- `web/storefront/themes/default/partials/share-buttons.ejs` (new)
- `web/storefront/themes/default/partials/header.ejs` — OG/Twitter meta tags (conditional)
- `public/javascripts/storefront/share.js` (new) — share popup, copy link

#### E5 — Related products & recommendations

- "You may also like" — same category, different brand
- "Complete the look" — complementary products (accessories with clothing)
- "Recently viewed" — from session/localStorage
- "Customers also bought" — from order history analytics

**Files**:

- `modules/product/interface/controllers/storefrontProductController.ts` — recommendation queries
- `web/storefront/themes/default/product/pdp.ejs` — recommendation sections

#### E6 — Stock display per store

- Show stock level for the current store
- "In Stock — Ready to ship" (high stock)
- "Only X left — Order soon" (low stock, threshold from store settings)
- "Out of Stock — Notify me" (no stock, with email signup)
- "Backorder — Ships in X days" (if backorder allowed)

**Files**:

- `modules/product/interface/controllers/storefrontProductController.ts` — fetch store stock
- `web/storefront/themes/default/product/pdp.ejs` — stock display
- `public/javascripts/storefront/pdp.js` — "notify me" form

---

### Epic F — Storefront Design System (P1)

**Goal**: Beautiful, fashion-appropriate design that works across all pages.

#### F1 — Design tokens

Define a fashion-appropriate design system:

```
Colors:
  --color-primary: #1a1a1a (near-black, premium feel)
  --color-secondary: #6b7280 (gray)
  --color-accent: #c89b3c (gold accent)
  --color-background: #fafafa
  --color-surface: #ffffff
  --color-text: #1a1a1a
  --color-muted: #6b7280
  --color-success: #16a34a
  --color-error: #dc2626
  --color-sale: #dc2626

Typography:
  --font-heading: 'Playfair Display', serif (for fashion headlines)
  --font-body: 'Inter', sans-serif
  --font-size-base: 16px

Spacing: 4px grid (4, 8, 12, 16, 24, 32, 48, 64)
Border radius: 0 (sharp, editorial) or 4px (soft)
```

**Files**:

- `tailwind.config.js` — extend with fashion design tokens
- `public/stylesheets/storefront/main.css` — CSS custom properties
- `modules/theme/domain/builtInThemes.ts` — update default theme settings

#### F2 — Header redesign

- Sticky header with announcement bar (free shipping promo)
- Logo (store-specific via theme override)
- Mega menu navigation (Men / Women / Accessories / Footwear / Brands / Sale)
- Search bar with autocomplete
- Currency switcher (if multi-currency enabled)
- Account icon (dropdown: Sign In, My Orders, Wishlist, Addresses)
- Cart icon with item count badge
- Mobile: hamburger menu with slide-out drawer

**Files**:

- `web/storefront/themes/default/partials/header.ejs` — full redesign
- `web/storefront/themes/default/partials/announcement-bar.ejs` (new)
- `public/javascripts/storefront/header.js` (new) — mega menu, mobile drawer, search autocomplete

#### F3 — Footer redesign

- Newsletter signup
- Link columns: Shop, Help, About, Legal
- Social media icons (Instagram, Facebook, Twitter, Pinterest)
- Payment method icons
- Copyright + store region indicator

**Files**:

- `web/storefront/themes/default/partials/footer.ejs` — full redesign

#### F4 — Home page redesign

- Hero carousel/banner (3-4 slides with seasonal campaigns)
- Featured brands strip (logos)
- "New Arrivals" product carousel
- "Best Sellers" product carousel
- Category tiles (Men, Women, Accessories, Footwear)
- Promotional banner (sale, free shipping)
- Instagram feed (if integrated)
- Trust badges (secure checkout, free returns, etc.)

**Files**:

- `web/storefront/themes/default/page/home.ejs` — full redesign
- `public/javascripts/storefront/home.js` (new) — carousel, lazy loading

#### F5 — Reusable partials

Create a library of reusable EJS partials:

- `product-card.ejs` — product card (used in PLP, home, recommendations)
- `price.ejs` — price display with currency + tax mode
- `image-gallery.ejs` — image gallery with zoom
- `share-buttons.ejs` — social share row
- `breadcrumb.ejs` — breadcrumb navigation
- `pagination.ejs` — pagination controls (exists, enhance)
- `rating-stars.ejs` — star rating display
- `size-guide.ejs` — size guide modal content
- `newsletter-signup.ejs` — newsletter form
- `empty-state.ejs` — "no products found" / "empty cart" states

**Files**:

- `web/storefront/themes/default/partials/*.ejs` (new + enhanced)

---

### Epic G — Search Experience (P1)

**Goal**: Fast, relevant search with autocomplete and suggestions.

#### G1 — Search page redesign

- Large search bar
- Search results as product grid (reuse PLP)
- "Did you mean?" suggestions for typos
- Recent searches (from session)
- Popular searches
- No-results state with category links

**Files**:

- `web/storefront/themes/default/search/results.ejs` (new)
- `modules/product/interface/controllers/storefrontProductController.ts` — enhance `searchProducts`

#### G2 — Search autocomplete

- Header search bar with dropdown autocomplete
- Shows: product suggestions, category suggestions, brand suggestions
- Debounced (300ms)
- Keyboard navigation (arrow keys + enter)

**Files**:

- `public/javascripts/storefront/header.js` — autocomplete logic
- `modules/product/interface/controllers/storefrontProductController.ts` — `/api/search/suggest` endpoint
- `web/storefront/storefrontRouter.ts` — add suggest route

---

### Epic H — Cart & Checkout UX (P1)

**Goal**: Smooth, conversion-optimized cart and checkout flow.

#### H1 — AJAX cart

- Add to cart without page reload
- Slide-out cart drawer showing items
- Cart count badge updates in header
- Quantity update in drawer
- Remove item in drawer
- "Proceed to Checkout" button in drawer

**Files**:

- `public/javascripts/storefront/cart.js` (new) — AJAX cart logic
- `web/storefront/themes/default/partials/cart-drawer.ejs` (new) — slide-out cart
- `web/storefront/themes/default/partials/header.ejs` — cart drawer container

#### H2 — Cart page redesign

- Clean table with product image, name, variant, price, quantity, total
- Quantity stepper (+/-)
- Remove link
- "You might also like" recommendations
- Order summary sidebar: subtotal, shipping estimate, tax estimate, total
- Promo code input
- "Continue Shopping" + "Proceed to Checkout" buttons

**Files**:

- `web/storefront/themes/default/basket/basket.ejs` — redesign

#### H3 — Checkout flow

- Multi-step or single-page checkout (configurable)
- Steps: Shipping Address → Shipping Method → Payment → Review
- Guest checkout option (if `store.settings.allowGuestCheckout`)
- Address autocomplete (UK postcode lookup, US address validation)
- Shipping method selection with rates
- Order summary sidebar (sticky)
- Trust signals (SSL, payment icons)

**Files**:

- `web/storefront/themes/default/shop/checkout.ejs` — redesign
- `public/javascripts/storefront/checkout.js` — enhance existing

---

### Epic I — SEO & Performance (P2)

#### I1 — Meta tags

- Per-product meta title + description (from `product.metaTitle` / `product.metaDescription` or generated)
- Per-category meta tags
- Per-brand meta tags
- Canonical URLs
- hreflang tags for multi-region (en-GB, en-US)

**Files**:

- `web/storefront/themes/default/partials/header.ejs` — dynamic meta tags
- `modules/product/interface/controllers/storefrontProductController.ts` — pass meta to views

#### I2 — Structured data (JSON-LD)

- Product schema (name, image, price, availability, rating)
- BreadcrumbList schema
- Organization schema
- WebSite schema with SearchAction

**Files**:

- `web/storefront/themes/default/partials/json-ld.ejs` (new) — structured data
- `web/storefront/themes/default/product/pdp.ejs` — include product JSON-LD

#### I3 — Sitemap

- Per-store sitemap at `/sitemap.xml`
- Includes: products, categories, brands, content pages
- Excludes: cart, checkout, account pages

**Files**:

- `web/storefront/storefrontRouter.ts` — sitemap route
- `modules/product/interface/controllers/storefrontProductController.ts` — sitemap generation

#### I4 — Image optimization

- Lazy loading on all images (`loading="lazy"`)
- Responsive image sizes (`srcset`)
- WebP format where supported
- Placeholder blur for images loading

**Files**:

- `web/storefront/themes/default/partials/image.ejs` (new) — responsive image helper
- All views using images — update to use `image.ejs` partial

---

### Epic J — Storefront JavaScript Architecture (P1)

**Goal**: Clean, modular JS for interactivity without a heavy framework.

#### J1 — JS module structure

```
public/javascripts/storefront/
├── main.js          — entry point, initializes all modules
├── header.js        — mega menu, mobile drawer, search autocomplete
├── cart.js          — AJAX cart, cart drawer
├── plp.js           — filters, sorting, infinite scroll, grid/list toggle
├── pdp.js           — variant selector, gallery, tabs, share
├── checkout.js      — checkout flow (enhance existing)
├── home.js          — carousels, lazy loading
├── account.js       — account dropdown, address forms
├── utils.js         — shared utilities (fetch, debounce, formatCurrency)
└── components/
    ├── modal.js      — reusable modal
    ├── quick-view.js — product quick view modal
    └── toast.js      — toast notifications
```

All JS uses vanilla ES modules (no jQuery, no React). Loaded via `<script type="module">`.

#### J2 — Build pipeline

- Bundle storefront JS with esbuild (already used for production build)
- Source maps in development
- Minified in production

**Files**:

- `package.json` — add `storefront:build` script
- `esbuild.config.js` or inline in package.json script

---

## 4. Implementation Order

```
Phase 1 (Foundation — P0):
  A1 → A2 → A3 → A4 → A5    (Multi-store foundation)
  B1 → B2 → B3 → B4          (Brand system)
  C1 → C2 → C3 → C4 → C5 → C6 → C7 → C8  (Fashion seeds)

Phase 2 (Core UX — P1):
  F1 → F2 → F3 → F4 → F5    (Design system)
  D1 → D2 → D3 → D4 → D5    (PLP)
  E1 → E2 → E3 → E4 → E5 → E6  (PDP)
  G1 → G2                     (Search)
  H1 → H2 → H3               (Cart & Checkout)
  J1 → J2                     (JS architecture)

Phase 3 (Polish — P2):
  I1 → I2 → I3 → I4          (SEO & Performance)
```

---

## 5. File Summary

### New files

| Category         | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Middleware       | `web/storefront/storeResolutionMiddleware.ts`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Brand system     | `modules/product/domain/repositories/BrandRepository.ts`, `modules/product/infrastructure/repositories/brandRepo.ts`, `web/admin/controllers/brandController.ts`, `web/admin/views/catalog/brands/*.ejs`, `modules/product/interface/controllers/storefrontBrandController.ts`                                                                                                                                                                                     |
| Storefront views | `web/storefront/themes/default/brand/index.ejs`, `brand/show.ejs`, `search/results.ejs`, `partials/product-card.ejs`, `partials/price.ejs`, `partials/image-gallery.ejs`, `partials/share-buttons.ejs`, `partials/breadcrumb.ejs`, `partials/rating-stars.ejs`, `partials/size-guide.ejs`, `partials/newsletter-signup.ejs`, `partials/empty-state.ejs`, `partials/cart-drawer.ejs`, `partials/announcement-bar.ejs`, `partials/json-ld.ejs`, `partials/image.ejs` |
| Storefront JS    | `public/javascripts/storefront/main.js`, `header.js`, `cart.js`, `plp.js`, `pdp.js`, `home.js`, `account.js`, `utils.js`, `components/modal.js`, `components/quick-view.js`, `components/toast.js`                                                                                                                                                                                                                                                                 |
| Seeds            | `seeds/20260913100000_seedMultiStoreData.js` through `seeds/20260913100800_seedFashionShipping.js` (9 seed files)                                                                                                                                                                                                                                                                                                                                                  |

### Modified files

| Category       | Files                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Router         | `web/storefront/storefrontRouter.ts` (add middleware, brand routes, search suggest, sitemap)                                                                       |
| Controllers    | `modules/product/interface/controllers/storefrontProductController.ts`, `storefrontCategoryController.ts`                                                          |
| Domain         | `modules/product/domain/repositories/ProductRepository.ts` (extend filters)                                                                                        |
| Infrastructure | `modules/product/infrastructure/repositories/ProductDataRepository.ts` (implement filters), `modules/product/infrastructure/index.ts` (export brand repo)          |
| Admin router   | `web/admin/adminRouters.ts` (add brand routes)                                                                                                                     |
| Theme          | `modules/theme/domain/builtInThemes.ts` (update design tokens)                                                                                                     |
| Views          | `web/storefront/themes/default/partials/header.ejs`, `footer.ejs`, `page/home.ejs`, `product/plp.ejs`, `product/pdp.ejs`, `basket/basket.ejs`, `shop/checkout.ejs` |
| CSS            | `tailwind.config.js`, `public/stylesheets/storefront/main.css`                                                                                                     |
| Libs           | `libs/money.ts` (format helper)                                                                                                                                    |
| Package        | `package.json` (storefront:build script)                                                                                                                           |

---

## 6. Testing Strategy

### Unit tests

- Brand repository CRUD
- Store resolution middleware
- Product filter logic (brand, size, color, price)
- Money formatting (multi-currency)
- Tax display mode logic

### Integration tests

- Multi-store product visibility (UK product not visible on US store)
- Store-scoped inventory (UK stock doesn't show on US PDP)
- Currency display (GBP on UK, USD on US)
- Checkout flow with store-specific shipping + tax

### E2E (manual)

- Browse UK store → see GBP prices, VAT inclusive
- Switch to US store → see USD prices, tax exclusive
- Filter PLP by brand + size + color
- Select variant on PDP → see stock update
- Add to cart → AJAX drawer opens
- Checkout → shipping + tax calculated for store region

---

## 7. Acceptance Criteria

### Multi-store

- [ ] UK store serves at `uk.shop.example.com` with GBP prices and VAT-inclusive display
- [ ] US store serves at `us.shop.example.com` with USD prices and tax-exclusive display
- [ ] Each store shows only its own inventory
- [ ] Currency switcher allows viewing prices in alternate currency
- [ ] Store-specific shipping rates and tax rules apply at checkout

### Brands

- [ ] Admin can create/edit/delete brands with logo, description, country of origin
- [ ] `/brands` page lists all brands with logos
- [ ] `/brands/:slug` shows brand landing page with story + featured products
- [ ] PLP can filter by brand
- [ ] PDP shows brand name with link to brand page

### Catalog

- [ ] Category tree has Men, Women, Unisex, Accessories, Footwear with subcategories
- [ ] 30-50 seeded products across 5+ brands with size/color variants
- [ ] Each variant has SKU, price, and store-specific stock
- [ ] Products have images (placeholder or real)

### PLP

- [ ] Filters: brand, size, color, price range, material, availability, sale
- [ ] Sorting: featured, newest, price, name, best-selling, rating
- [ ] Grid/list view toggle
- [ ] Pagination + infinite scroll option
- [ ] Product cards with hover image, quick-view, add-to-cart, wishlist

### PDP

- [ ] Variant selector (size + color) updates SKU, price, stock, image
- [ ] Image gallery with zoom, thumbnails, lightbox
- [ ] Tabs: description, specifications, size guide, shipping/returns, reviews
- [ ] Social share buttons + Open Graph tags
- [ ] Related products, "complete the look", recently viewed
- [ ] Store-specific stock display

### Design

- [ ] Fashion-appropriate design tokens (typography, colors, spacing)
- [ ] Sticky header with mega menu, search, account, cart
- [ ] Home page with hero carousel, brand strip, product carousels, category tiles
- [ ] Footer with newsletter, links, social, payment icons
- [ ] Mobile responsive (hamburger menu, responsive grid, touch-friendly)

### Search

- [ ] Search page with results grid
- [ ] Header search with autocomplete (products, categories, brands)
- [ ] "Did you mean" suggestions
- [ ] Popular searches

### Cart & Checkout

- [ ] AJAX add-to-cart with slide-out drawer
- [ ] Cart page with quantity steppers, recommendations, promo code
- [ ] Multi-step checkout (address → shipping → payment → review)
- [ ] Guest checkout option
- [ ] Store-specific shipping + tax at checkout

---

## 8. Out of Scope

- B2B module (wholesale, bulk pricing tiers, quote requests)
- Marketplace module (multi-seller, seller onboarding, seller dashboards)
- Mobile app (native iOS/Android)
- Headless/API-only storefront (we're building server-rendered EJS)
- Real payment gateway integration (use test/stripe test mode)
- Real shipping carrier integration (use seeded rates)
- Product reviews import from external sources
- AI-powered recommendations (use simple category/brand matching)
- Live chat (use support ticket system)
- AR/VR product visualization
