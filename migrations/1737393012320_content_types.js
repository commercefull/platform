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
    allowed_blocks: { type: "text[]" }, // Array of block types that can be used with this content type
    default_template: { type: "uuid" }, // Default template ID, will be updated with foreign key after template table creation
    required_fields: { type: "jsonb" }, // Fields that must be completed for this content type
    meta_fields: { type: "jsonb" }, // Custom metadata fields definition
    is_system: { type: "boolean", notNull: true, default: false }, // System types cannot be deleted
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for content types
  pgm.createIndex("content_type", "slug");
  pgm.createIndex("content_type", "is_active");

  // Create table for allowed block types that can be used across the system
  pgm.createTable("content_block_type", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true, unique: true },
    description: { type: "text" },
    icon: { type: "varchar(50)" },
    category: { type: "varchar(100)" }, // For UI grouping (e.g., "Basic", "Media", "Layout", "Commerce")
    default_config: { type: "jsonb" }, // Default configuration for this block type
    schema: { type: "jsonb" }, // JSON schema defining the block's data structure
    is_system: { type: "boolean", notNull: true, default: false }, // System blocks cannot be deleted
    is_active: { type: "boolean", notNull: true, default: true },
    sort_order: { type: "integer", notNull: true, default: 0 }, // For custom ordering in UI
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for block types
  pgm.createIndex("content_block_type", "slug");
  pgm.createIndex("content_block_type", "category");
  pgm.createIndex("content_block_type", "is_active");
  pgm.createIndex("content_block_type", "sort_order");

  // Add some basic system content types
  pgm.sql(`
    INSERT INTO "content_type" ("name", "slug", "description", "is_system") 
    VALUES 
      ('Page', 'page', 'Standard web page content', true),
      ('Blog Post', 'blog-post', 'Blog article content', true),
      ('Product Page', 'product-page', 'Content for product detail pages', true),
      ('Category Page', 'category-page', 'Content for product category pages', true),
      ('Landing Page', 'landing-page', 'Special promotional landing pages', true)
  `);

  // Add basic block types
  pgm.sql(`
    INSERT INTO "content_block_type" ("name", "slug", "description", "category", "is_system", "sort_order") 
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
