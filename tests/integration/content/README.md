# Content Feature Integration Tests

This directory contains integration tests for the Content feature, organized by domain.

## Test Structure

```
tests/integration/content/
├── testConstants.ts          # Shared test data and constants
├── pages/
│   └── pages.test.ts         # Page CRUD and actions (publish, schedule, duplicate)
├── categories/
│   └── categories.test.ts    # Category CRUD and hierarchy management
├── navigation/
│   └── navigation.test.ts    # Navigation menus and items
├── media/
│   └── media.test.ts         # Media files and folder management
├── redirects/
│   └── redirects.test.ts     # URL redirect rules
├── templates/
│   └── templates.test.ts     # Template CRUD and duplication
└── content.test.ts           # Legacy combined tests (deprecated)
```

## Running Tests

### Run all content tests
```bash
npm test -- --testPathPattern="tests/integration/content"
```

### Run specific domain tests
```bash
# Pages
npm test -- --testPathPattern="tests/integration/content/pages"

# Categories
npm test -- --testPathPattern="tests/integration/content/categories"

# Navigation
npm test -- --testPathPattern="tests/integration/content/navigation"

# Media
npm test -- --testPathPattern="tests/integration/content/media"

# Redirects
npm test -- --testPathPattern="tests/integration/content/redirects"

# Templates
npm test -- --testPathPattern="tests/integration/content/templates"
```

## Test Coverage

### Pages (`pages.test.ts`)
- GET /content/pages - List pages with pagination
- POST /content/pages - Create new page
- GET /content/pages/:id - Get page by ID
- GET /content/pages/:id/full - Get page with blocks
- PUT /content/pages/:id - Update page
- DELETE /content/pages/:id - Delete page
- POST /content/pages/:id/publish - Publish page
- POST /content/pages/:id/unpublish - Unpublish page
- POST /content/pages/:id/schedule - Schedule page
- POST /content/pages/:id/duplicate - Duplicate page

### Categories (`categories.test.ts`)
- GET /content/categories - List categories
- GET /content/categories/tree - Get category tree
- POST /content/categories - Create category
- GET /content/categories/:id - Get category by ID
- PUT /content/categories/:id - Update category
- DELETE /content/categories/:id - Delete category
- POST /content/categories/:id/move - Move category in hierarchy

### Navigation (`navigation.test.ts`)
- GET /content/navigations - List navigations
- POST /content/navigations - Create navigation
- GET /content/navigations/:id - Get navigation by ID
- GET /content/navigations/:id/items - Get navigation with items
- PUT /content/navigations/:id - Update navigation
- DELETE /content/navigations/:id - Delete navigation
- POST /content/navigations/:navigationId/items - Add navigation item
- PUT /content/navigation-items/:id - Update navigation item
- DELETE /content/navigation-items/:id - Delete navigation item
- POST /content/navigations/:navigationId/items/reorder - Reorder items

### Media (`media.test.ts`)
- GET /content/media - List media files
- POST /content/media - Upload/register media
- GET /content/media/:id - Get media by ID
- PUT /content/media/:id - Update media
- DELETE /content/media/:id - Delete media
- POST /content/media/move - Move media to folder
- GET /content/media-folders - List folders
- GET /content/media-folders/tree - Get folder tree
- POST /content/media-folders - Create folder
- PUT /content/media-folders/:id - Update folder
- DELETE /content/media-folders/:id - Delete folder

### Redirects (`redirects.test.ts`)
- GET /content/redirects - List redirects
- POST /content/redirects - Create redirect
- GET /content/redirects/:id - Get redirect by ID
- PUT /content/redirects/:id - Update redirect
- DELETE /content/redirects/:id - Delete redirect

### Templates (`templates.test.ts`)
- GET /content/templates - List templates
- POST /content/templates - Create template
- GET /content/templates/:id - Get template by ID
- PUT /content/templates/:id - Update template
- DELETE /content/templates/:id - Delete template
- POST /content/templates/:id/duplicate - Duplicate template

## Environment Variables

- `API_URL` - Base URL for API (default: `http://localhost:3000`)

## Notes

- Tests create their own test data and clean up after themselves
- Tests use unique timestamps in slugs to avoid conflicts
- Tests are designed to run in isolation and in parallel
- Each test file handles its own setup and teardown
