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
    contentTypeId: { type: "uuid", notNull: true, references: "content_type" },
    templateId: { type: "uuid", references: "content_template" },
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
    accessPassword: { type: "varchar(255)" }, // For password-protected pages
    summary: { type: "text" }, // Short excerpt or description
    featuredImage: { type: "text" }, // URL or path to featured image
    parentId: { type: "uuid", references: "content_page" }, // For hierarchical structure
    sortOrder: { type: "integer", default: 0 }, // For ordering sibling pages
    metaTitle: { type: "varchar(255)" }, // SEO meta title
    metaDescription: { type: "text" }, // SEO meta description
    metaKeywords: { type: "text" }, // SEO meta keywords
    openGraphImage: { type: "text" }, // Image for social sharing
    canonicalUrl: { type: "text" }, // Canonical URL for SEO
    noIndex: { type: "boolean", default: false }, // Whether search engines should index this page
    customFields: { type: "jsonb" }, // Custom metadata defined by content type
    publishedAt: { type: "timestamp" },
    scheduledAt: { type: "timestamp" },
    expiresAt: { type: "timestamp" },
    isHomePage: { type: "boolean", default: false },
    path: { type: "varchar(255)" }, // Full page path including parent paths
    depth: { type: "integer", default: 0 }, // Depth in page hierarchy
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" }, // Reference to admin user
    publishedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for content pages
  pgm.createIndex("content_page", "slug");
  pgm.createIndex("content_page", "contentTypeId");
  pgm.createIndex("content_page", "templateId");
  pgm.createIndex("content_page", "status");
  pgm.createIndex("content_page", "parentId");
  pgm.createIndex("content_page", "path");
  pgm.createIndex("content_page", "isHomePage");
  pgm.createIndex("content_page", "publishedAt");
  
  // Create unique index for home page (only one can exist)
  pgm.createIndex("content_page", "isHomePage", { unique: true, where: "isHomePage = true" });
  
  // Create unique index for slugs within the same parent
  pgm.createIndex("content_page", ["parentId", "slug"], { unique: true });

  // Create content blocks table
  pgm.createTable("content_block", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    contentPageId: { type: "uuid", notNull: true, references: "content_page", onDelete: "CASCADE" },
    blockTypeId: { type: "uuid", notNull: true, references: "content_block_type" },
    title: { type: "varchar(255)" }, // Optional title for block (for admin UI)
    area: { type: "varchar(100)", notNull: true, default: "main" }, // Layout area this block belongs to
    sortOrder: { type: "integer", notNull: true, default: 0 }, // Order within its area
    content: { type: "jsonb", notNull: true, default: "{}" }, // Block-specific content data
    settings: { type: "jsonb", default: "{}" }, // Block-specific settings
    isVisible: { type: "boolean", notNull: true, default: true },
    cssClasses: { type: "text" }, // Custom CSS classes
    conditions: { type: "jsonb" }, // Conditional display rules
    parentBlockId: { type: "uuid", references: "content_block" }, // For nested blocks (e.g., columns)
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for content blocks
  pgm.createIndex("content_block", "contentPageId");
  pgm.createIndex("content_block", "blockTypeId");
  pgm.createIndex("content_block", "area");
  pgm.createIndex("content_block", "parentBlockId");
  pgm.createIndex("content_block", ["contentPageId", "area", "sortOrder"]);

  // Create a version history table for content pages
  pgm.createTable("content_page_version", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    contentPageId: { type: "uuid", notNull: true, references: "content_page", onDelete: "CASCADE" },
    version: { type: "integer", notNull: true },
    title: { type: "varchar(255)", notNull: true },
    status: { type: "varchar(20)", notNull: true },
    summary: { type: "text" },
    content: { type: "jsonb" }, // Serialized page content with blocks
    customFields: { type: "jsonb" },
    comment: { type: "text" }, // Version comment/note
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for version history
  pgm.createIndex("content_page_version", "contentPageId");
  pgm.createIndex("content_page_version", ["contentPageId", "version"], { unique: true });

  // Add some default pages
  pgm.sql(`
    INSERT INTO "content_page" (
      "title", 
      "slug", 
      "contentTypeId", 
      "templateId", 
      "status", 
      "path", 
      "isHomePage", 
      "metaTitle"
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
