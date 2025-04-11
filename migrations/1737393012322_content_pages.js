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
  // Create content pages table
  pgm.createTable("content_page", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    title: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(255)", notNull: true },
    content_type_id: { type: "uuid", notNull: true, references: "content_type" },
    template_id: { type: "uuid", references: "content_template" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "draft", 
      check: "status IN ('draft', 'published', 'scheduled', 'archived')" 
    },
    visibility: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "public", 
      check: "visibility IN ('public', 'private', 'password_protected')" 
    },
    access_password: { type: "varchar(255)" }, // For password-protected pages
    summary: { type: "text" }, // Short excerpt or description
    featured_image: { type: "text" }, // URL or path to featured image
    parent_id: { type: "uuid", references: "content_page" }, // For hierarchical structure
    sort_order: { type: "integer", default: 0 }, // For ordering sibling pages
    meta_title: { type: "varchar(255)" }, // SEO meta title
    meta_description: { type: "text" }, // SEO meta description
    meta_keywords: { type: "text" }, // SEO meta keywords
    open_graph_image: { type: "text" }, // Image for social sharing
    canonical_url: { type: "text" }, // Canonical URL for SEO
    no_index: { type: "boolean", default: false }, // Whether search engines should index this page
    custom_fields: { type: "jsonb" }, // Custom metadata defined by content type
    published_at: { type: "timestamp" },
    scheduled_at: { type: "timestamp" },
    expires_at: { type: "timestamp" },
    is_home_page: { type: "boolean", default: false },
    path: { type: "varchar(255)" }, // Full page path including parent paths
    depth: { type: "integer", default: 0 }, // Depth in page hierarchy
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    updated_by: { type: "uuid" }, // Reference to admin user
    published_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for content pages
  pgm.createIndex("content_page", "slug");
  pgm.createIndex("content_page", "content_type_id");
  pgm.createIndex("content_page", "template_id");
  pgm.createIndex("content_page", "status");
  pgm.createIndex("content_page", "parent_id");
  pgm.createIndex("content_page", "path");
  pgm.createIndex("content_page", "is_home_page");
  pgm.createIndex("content_page", "published_at");
  
  // Create unique index for home page (only one can exist)
  pgm.createIndex("content_page", "is_home_page", { unique: true, where: "is_home_page = true" });
  
  // Create unique index for slugs within the same parent
  pgm.createIndex("content_page", ["parent_id", "slug"], { unique: true });

  // Create content blocks table
  pgm.createTable("content_block", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    content_page_id: { type: "uuid", notNull: true, references: "content_page", onDelete: "CASCADE" },
    block_type_id: { type: "uuid", notNull: true, references: "content_block_type" },
    title: { type: "varchar(255)" }, // Optional title for block (for admin UI)
    area: { type: "varchar(100)", notNull: true, default: "main" }, // Layout area this block belongs to
    sort_order: { type: "integer", notNull: true, default: 0 }, // Order within its area
    content: { type: "jsonb", notNull: true, default: "{}" }, // Block-specific content data
    settings: { type: "jsonb", default: "{}" }, // Block-specific settings
    is_visible: { type: "boolean", notNull: true, default: true },
    css_classes: { type: "text" }, // Custom CSS classes
    conditions: { type: "jsonb" }, // Conditional display rules
    parent_block_id: { type: "uuid", references: "content_block" }, // For nested blocks (e.g., columns)
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for content blocks
  pgm.createIndex("content_block", "content_page_id");
  pgm.createIndex("content_block", "block_type_id");
  pgm.createIndex("content_block", "area");
  pgm.createIndex("content_block", "parent_block_id");
  pgm.createIndex("content_block", ["content_page_id", "area", "sort_order"]);

  // Create a version history table for content pages
  pgm.createTable("content_page_version", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    content_page_id: { type: "uuid", notNull: true, references: "content_page", onDelete: "CASCADE" },
    version: { type: "integer", notNull: true },
    title: { type: "varchar(255)", notNull: true },
    status: { type: "varchar(20)", notNull: true },
    summary: { type: "text" },
    content: { type: "jsonb" }, // Serialized page content with blocks
    custom_fields: { type: "jsonb" },
    comment: { type: "text" }, // Version comment/note
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for version history
  pgm.createIndex("content_page_version", "content_page_id");
  pgm.createIndex("content_page_version", ["content_page_id", "version"], { unique: true });

  // Add some default pages
  pgm.sql(`
    INSERT INTO "content_page" (
      "title", 
      "slug", 
      "content_type_id", 
      "template_id", 
      "status", 
      "path", 
      "is_home_page", 
      "meta_title"
    )
    VALUES (
      'Home', 
      'home', 
      (SELECT id FROM content_type WHERE slug = 'page'), 
      (SELECT id FROM content_template WHERE slug = 'standard-page'), 
      'published', 
      '/home', 
      true, 
      'Welcome to Our Store'
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("content_page_version");
  pgm.dropTable("content_block");
  pgm.dropTable("content_page");
};
