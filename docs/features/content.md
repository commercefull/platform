# Content Feature

The Content Feature is a core component of the CommerceFull platform that provides comprehensive content management capabilities for e-commerce applications.

## Overview

This feature enables businesses to create, manage, and publish various types of content, from simple pages to complex structured content. It supports templating, content blocks, and a flexible schema system for creating custom content types tailored to specific business needs.

## Key Components

### Data Models

- **ContentType**: Defines the structure and schema for content (name, slug, schema, etc.)
- **ContentPage**: Represents a full page with metadata, SEO properties, and content blocks
- **ContentBlock**: Individual content sections within a page
- **ContentTemplate**: Reusable templates for layouts and sections

### Repository Layer

The repository layer (`repos/contentRepo.ts`) provides data access methods following the platform's standardized naming convention:
- Database columns use `snake_case` (e.g., `content_type_id`, `is_home_page`)
- TypeScript interfaces use `camelCase` (e.g., `contentTypeId`, `isHomePage`)
- Field mapping dictionaries translate between naming conventions
- Transformation functions convert database records to TypeScript objects

### Controllers

The controller layer handles HTTP requests and responses:
- `contentController.ts`: Administrative content management operations
- `contentPublicController.ts`: Customer-facing content operations
- `pageController.ts`: Standard page retrieval and form handling

### Routes

- **Public Routes** (`router.ts`): Customer-facing endpoints for accessing published content
- **Admin Routes** (`routerAdmin.ts`): Administrative endpoints for content management

## API Endpoints

### Public Content Endpoints

- `GET /pages`: List all published pages
- `GET /pages/:slug`: Get a published page by its slug
- `GET /types`: Get active content types
- `GET /`: Home page
- `GET /about-us`: About us page
- `GET /shipping-policy`: Shipping policy page
- `GET /careers`: Careers page
- `GET /contact-us`: Contact us page
- `POST /contact-us`: Handle contact form submissions

### Admin Content Endpoints

#### Content Types
- `GET /admin/content/types`: List all content types
- `POST /admin/content/types`: Create a new content type
- `GET /admin/content/types/:id`: Get details for a specific content type
- `GET /admin/content/types/slug/:slug`: Get content type by slug
- `PUT /admin/content/types/:id`: Update content type
- `DELETE /admin/content/types/:id`: Delete content type

#### Content Pages
- `GET /admin/content/pages`: List all content pages
- `POST /admin/content/pages`: Create a new content page
- `GET /admin/content/pages/:id`: Get details for a specific page
- `GET /admin/content/pages/:id/full`: Get page with all blocks and related data
- `PUT /admin/content/pages/:id`: Update page
- `DELETE /admin/content/pages/:id`: Delete page

#### Content Blocks
- `GET /admin/content/pages/:pageId/blocks`: Get blocks for a specific page
- `POST /admin/content/blocks`: Create a new block
- `GET /admin/content/blocks/:id`: Get block details
- `PUT /admin/content/blocks/:id`: Update block
- `DELETE /admin/content/blocks/:id`: Delete block
- `POST /admin/content/pages/:pageId/blocks/reorder`: Reorder blocks on a page

#### Content Templates
- `GET /admin/content/templates`: List all templates
- `POST /admin/content/templates`: Create a new template
- `GET /admin/content/templates/:id`: Get template details
- `PUT /admin/content/templates/:id`: Update template
- `DELETE /admin/content/templates/:id`: Delete template

## Naming Convention

This feature follows the platform's standardized naming convention:

1. **Database Columns**: Use `snake_case` (e.g., `content_type_id`, `is_home_page`, `meta_description`)
2. **TypeScript Interfaces**: Use `camelCase` (e.g., `contentTypeId`, `isHomePage`, `metaDescription`)
3. **Repository Methods**: Handle the translation between naming conventions using mapping dictionaries

Field mapping dictionaries in the repository define the mapping between database columns and TypeScript interface properties:

```typescript
const contentPageFields: Record<string, string> = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  contentTypeId: 'content_type_id',
  templateId: 'template_id',
  status: 'status',
  visibility: 'visibility',
  accessPassword: 'access_password',
  summary: 'summary',
  featuredImage: 'featured_image',
  parentId: 'parent_id',
  sortOrder: 'sort_order',
  metaTitle: 'meta_title',
  metaDescription: 'meta_description',
  metaKeywords: 'meta_keywords',
  // ...and so on
};
```

Transformation functions convert between database records and TypeScript objects:

```typescript
// Transform a database record to a TypeScript object
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

// Transform an array of database records to TypeScript objects
function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}
```

## Usage Examples

### Creating a Content Page

```typescript
// Create a new content page
const newPage = {
  title: 'New Blog Post',
  slug: 'new-blog-post',
  contentTypeId: 'blog-post-type-id',
  status: 'published',
  visibility: 'public',
  metaTitle: 'New Blog Post | My Store',
  metaDescription: 'This is a new blog post about our products',
  summary: 'A brief summary of the blog post'
};

const contentPage = await contentRepo.createPage(newPage);
```

### Adding Content Block to a Page

```typescript
// Add a content block to a page
const newBlock = {
  name: 'Main Content',
  pageId: 'page-id',
  contentTypeId: 'content-type-id',
  order: 1,
  content: {
    title: 'Welcome to our store',
    body: '<p>This is the main content of our page.</p>'
  },
  status: 'active'
};

const contentBlock = await contentRepo.createBlock(newBlock);
```

### Retrieving Published Content

```typescript
// Get the home page
const homePage = await contentRepo.findHomePage();

// Get a specific page by slug
const aboutPage = await contentRepo.findPageBySlug('about-us');

// Get content blocks for a page
const pageBlocks = await contentRepo.findBlocksByPageId(aboutPage.id);
```

## Integration

The content feature integrates with several other platform features:

- **Products**: For displaying product-related content and information
- **SEO**: For optimizing content for search engines
- **Media**: For managing images and files within content
- **Store**: For displaying store policies and information

## Best Practices

1. Always use the repository's transformation functions to handle database record conversion
2. Use content types to define structured content rather than free-form
3. Implement proper validation for user-submitted content
4. Use templates for consistent layouts across similar content
5. Follow the naming convention pattern for all database interactions

## Database Schema

The content feature uses the following tables:

- `content_type`: Defines content structure and schema
- `content_page`: Stores page metadata and properties
- `content_block`: Contains the actual content sections
- `content_template`: Defines reusable layout templates

## Security Considerations

- Sanitize all user-generated content before storing or displaying
- Implement proper access controls for administrative functions
- Validate all inputs according to content type schemas
- Use appropriate visibility settings for sensitive content
