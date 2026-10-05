# Advanced Content Setup

This guide covers the full content stack: content types and templates,
pages with translations and per-context publication, reusable blocks, the
visual page builder, navigation, media, redirects, and themes — including
how content is scoped per store, channel, and locale.

## The content model

```
ContentType        structural definition of a page kind
├── Template       reusable starting layout for new pages
└── ContentPage    an actual page (slug, status, SEO)
    ├── Translations   per-locale slug/title/body
    ├── Publications   which stores/channels/locales the page appears in
    ├── Versions       snapshot history, restorable
    └── Blocks         content blocks placed on the page

PageBuilderDraft   visual draft: regions + placed block types, publish flow
Navigation         menu trees of items, scopeable per store/channel
Theme              assigned per store, overridable per channel
Media              folders, files, usage tracking
```

## 1. Content types and templates

Content types define the structure of a page family (landing, article,
legal…). Templates provide pre-built starting layouts.

| Method                | Path                                        | Purpose              |
| --------------------- | ------------------------------------------- | -------------------- |
| `GET/POST/PUT/DELETE` | `/business/content/types`                   | Content type CRUD    |
| `GET`                 | `/business/content/types/slug/:slug`        | Lookup by slug       |
| `GET/POST/PUT/DELETE` | `/business/content/templates`               | Template CRUD        |
| `POST`                | `/business/content/templates/:id/duplicate` | Duplicate a template |

Admin UI: `/admin/content/templates`.

Seed reference: `seeds/20240805000900_seedContentTemplates.js` and
`seeds/20240805000903_seedContentTypes.js` create the starter types and
templates.

## 2. Pages

| Method                | Path                                                           | Purpose                 |
| --------------------- | -------------------------------------------------------------- | ----------------------- |
| `GET/POST/PUT/DELETE` | `/business/content/pages`                                      | Page CRUD               |
| `POST`                | `/business/content/pages/:id/publish` `/unpublish` `/schedule` | Lifecycle               |
| `POST`                | `/business/content/pages/:id/duplicate`                        | Duplicate               |
| `GET`                 | `/business/content/pages/:id/full`                             | Page with all relations |
| `GET/POST/DELETE`     | `/business/content/pages/:pageId/categories`                   | Category assignment     |
| `POST`                | `/business/content/pages/:pageId/categories/primary`           | Primary category        |
| `GET/POST`            | `/business/content/pages/:pageId/versions`                     | Version history         |
| `POST`                | `/business/content/pages/:pageId/versions/:versionId/restore`  | Restore                 |

Admin UI: `/admin/content/pages` (list, create, edit, view).

### Translations

Each page can carry per-locale translations with their own slug, so a German
page resolves `/ueber-uns` while the English page resolves `/about-us`.

| Method     | Path                                                     | Purpose                |
| ---------- | -------------------------------------------------------- | ---------------------- |
| `GET/POST` | `/business/content/pages/:pageId/translations`           | List / add translation |
| `GET`      | `/business/content/pages/:pageId/translations/:localeId` | Per-locale             |
| `DELETE`   | `/business/content/translations/:translationId`          | Remove                 |

Storefront resolution is locale-aware: the translated slug is matched via
the `locale` table before falling back to the base page slug.

### Publications (store / channel / locale scoping)

A page with **no** publication rows is globally visible. Once publications
exist, the page appears only where a matching row is published.

| Method     | Path                                                      | Purpose                |
| ---------- | --------------------------------------------------------- | ---------------------- |
| `GET/POST` | `/business/content/pages/:id/publications`                | List / add publication |
| `DELETE`   | `/business/content/pages/:id/publications/:publicationId` | Remove                 |

Each publication scopes the page by `storeId`, `salesChannelId`, and
`locale` (any combination nullable). Use this to run channel-specific
landing pages — e.g. a Facebook-only campaign page — or locale-specific
legal content.

## 3. Reusable blocks

Content blocks are standalone pieces (banners, promos, copy) that can be
attached to pages or scoped by store/channel metadata.

| Method                | Path                                             | Purpose       |
| --------------------- | ------------------------------------------------ | ------------- |
| `GET/POST/PUT/DELETE` | `/business/content/blocks`                       | Block CRUD    |
| `GET`                 | `/business/content/pages/:pageId/blocks`         | Page's blocks |
| `POST`                | `/business/content/pages/:pageId/blocks/reorder` | Reorder       |

Blocks carrying `scope` metadata (`storeId`, `channelId`) are filtered on
the storefront — a block scoped to another channel is never rendered.

Admin UI: `/admin/content/blocks`.

## 4. Page builder

The visual page builder works on **drafts**: block types are placed into
layout regions, then the draft publishes to a content page.

| Method       | Path                                                             | Purpose               |
| ------------ | ---------------------------------------------------------------- | --------------------- |
| `GET/POST`   | `/business/page-builder/drafts`                                  | Draft list / create   |
| `GET/DELETE` | `/business/page-builder/drafts/:draftId`                         | Draft detail / delete |
| `GET`        | `/business/page-builder/drafts/:draftId/preview`                 | Preview               |
| `PATCH`      | `/business/page-builder/drafts/:draftId/title` `/slug` `/theme`  | Draft metadata        |
| `GET`        | `/business/page-builder/block-types`                             | Available block types |
| `GET`        | `/business/page-builder/block-types/:category`                   | By category           |
| `POST`       | `/business/page-builder/drafts/:draftId/blocks`                  | Place a block         |
| `PATCH`      | `/business/page-builder/drafts/:draftId/blocks/:blockId`         | Edit block            |
| `PATCH`      | `/business/page-builder/drafts/:draftId/blocks/:blockId/move`    | Move block            |
| `POST`       | `/business/page-builder/drafts/:draftId/regions/:region/reorder` | Reorder region        |
| `POST`       | `/business/page-builder/drafts/:draftId/publish` `/unpublish`    | Publish flow          |

Admin UI: `/admin/pagebuilder`.

## 5. Navigation

Navigations are menu trees rendered in the storefront header/footer.

| Method            | Path                                                        | Purpose         |
| ----------------- | ----------------------------------------------------------- | --------------- |
| `GET/POST/DELETE` | `/business/content/navigations`                             | Navigation CRUD |
| `GET`             | `/business/content/navigations/:id/items`                   | Items           |
| `GET`             | `/business/content/navigations/:slug`                       | By slug         |
| `POST`            | `/business/content/navigations/:navigationId/items`         | Add item        |
| `POST`            | `/business/content/navigations/:navigationId/items/reorder` | Reorder         |
| `DELETE`          | `/business/content/navigation-items/:id`                    | Remove item     |

Items support the same store/channel `scope` metadata as blocks — a
scoped-out parent item hides its entire subtree, so channel-specific menus
behave predictably.

## 6. Media

| Method                | Path                                     | Purpose                  |
| --------------------- | ---------------------------------------- | ------------------------ |
| `GET/POST/PUT/DELETE` | `/business/content/media`                | Media CRUD               |
| `POST`                | `/business/content/media/move`           | Move between folders     |
| `GET/POST/DELETE`     | `/business/content/media-folders`        | Folder CRUD              |
| `GET`                 | `/business/content/media-folders/tree`   | Folder tree              |
| `POST`                | `/business/content/media/usage`          | Track usage on an entity |
| `GET`                 | `/business/content/media/:mediaId/usage` | Where a file is used     |

Admin UI: `/admin/content/media` (list, upload, edit, view).

## 7. Redirects

| Method            | Path                          | Purpose             |
| ----------------- | ----------------------------- | ------------------- |
| `GET/POST/DELETE` | `/business/content/redirects` | Redirect management |

Use redirects when re-slugging a page so old links keep working.

## 8. Themes

Themes are assigned per store and can be overridden per channel — e.g. a
POS channel renders a minimal theme while the website channel uses the full
storefront theme.

| Method            | Path                                           | Purpose          |
| ----------------- | ---------------------------------------------- | ---------------- |
| `GET/POST/DELETE` | `/business/theme`                              | Theme CRUD       |
| `POST`            | `/business/theme/:themeId/activate` `/archive` | Lifecycle        |
| `POST/DELETE`     | `/business/theme/assign/:storeId`              | Store assignment |
| `DELETE`          | `/business/theme/overrides/:overrideId`        | Remove override  |

Storefront theme resolution order: **channel override** (from the
store-channel assignment settings) → **store override** → **assigned
theme**. Results are cached with a bounded TTL.

Admin UI: `/admin/theme`.

## Scoping cheatsheet

| Content         | Scope mechanism                                                 |
| --------------- | --------------------------------------------------------------- |
| Page            | `contentPagePublication` rows (store / channel / locale)        |
| Page slug       | Per-locale `contentPageTranslation`                             |
| Block           | `scope` metadata (store / channel)                              |
| Navigation item | `scope` metadata (store / channel), ancestor-aware              |
| Collection      | `assortmentCollectionPublication` (store / channel, sort order) |
| Theme           | Channel settings → store settings → assigned theme              |

Anything without scope rows stays globally visible — opt into scoping only
where differentiation is needed.

## Related guides

- [Organization Setup](organization-setup.md) — stores, channels, locales
- [Product Setup and Dynamic Fields](product-setup.md) — catalog and
  collections that content links to
