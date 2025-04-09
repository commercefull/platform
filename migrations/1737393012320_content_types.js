/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create content types table to define different kinds of content
  pgm.createTable("content_type", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true, unique: true },
    description: { type: "text" },
    icon: { type: "varchar(50)" }, // Icon identifier for UI
    allowedBlocks: { type: "text[]" }, // Array of block types that can be used with this content type
    defaultTemplate: { type: "uuid" }, // Default template ID, will be updated with foreign key after template table creation
    requiredFields: { type: "jsonb" }, // Fields that must be completed for this content type
    metaFields: { type: "jsonb" }, // Custom metadata fields definition
    isSystem: { type: "boolean", notNull: true, default: false }, // System types cannot be deleted
    isActive: { type: "boolean", notNull: true, default: true },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for content types
  pgm.createIndex("content_type", "slug");
  pgm.createIndex("content_type", "isActive");

  // Create table for allowed block types that can be used across the system
  pgm.createTable("content_block_type", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true, unique: true },
    description: { type: "text" },
    icon: { type: "varchar(50)" },
    category: { type: "varchar(100)" }, // For UI grouping (e.g., "Basic", "Media", "Layout", "Commerce")
    defaultConfig: { type: "jsonb" }, // Default configuration for this block type
    schema: { type: "jsonb" }, // JSON schema defining the block's data structure
    isSystem: { type: "boolean", notNull: true, default: false }, // System blocks cannot be deleted
    isActive: { type: "boolean", notNull: true, default: true },
    sortOrder: { type: "integer", notNull: true, default: 0 }, // For custom ordering in UI
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for block types
  pgm.createIndex("content_block_type", "slug");
  pgm.createIndex("content_block_type", "category");
  pgm.createIndex("content_block_type", "isActive");
  pgm.createIndex("content_block_type", "sortOrder");

  // Add some basic system content types
  pgm.sql(`
    INSERT INTO "content_type" ("name", "slug", "description", "isSystem") 
    VALUES 
      ('Page', 'page', 'Standard web page content', true),
      ('Blog Post', 'blog-post', 'Blog article content', true),
      ('Product Page', 'product-page', 'Content for product detail pages', true),
      ('Category Page', 'category-page', 'Content for product category pages', true),
      ('Landing Page', 'landing-page', 'Special promotional landing pages', true)
  `);

  // Add basic block types
  pgm.sql(`
    INSERT INTO "content_block_type" ("name", "slug", "description", "category", "isSystem", "sortOrder") 
    VALUES 
      ('Heading', 'heading', 'Title or section heading', 'Basic', true, 10),
      ('Text', 'text', 'Rich text content', 'Basic', true, 20),
      ('Image', 'image', 'Single image with options', 'Media', true, 30),
      ('Gallery', 'gallery', 'Multiple image gallery', 'Media', true, 40),
      ('Video', 'video', 'Video embed or upload', 'Media', true, 50),
      ('Button', 'button', 'Call to action button', 'Basic', true, 60),
      ('Divider', 'divider', 'Visual separator', 'Layout', true, 70),
      ('Columns', 'columns', 'Multi-column layout', 'Layout', true, 80),
      ('Spacer', 'spacer', 'Vertical spacing control', 'Layout', true, 90),
      ('Product', 'product', 'Single product display', 'Commerce', true, 100),
      ('Product Grid', 'product-grid', 'Display multiple products', 'Commerce', true, 110),
      ('Form', 'form', 'Contact or subscription form', 'Interactive', true, 120),
      ('HTML', 'html', 'Custom HTML code', 'Advanced', true, 130)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("content_block_type");
  pgm.dropTable("content_type");
};
