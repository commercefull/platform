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
  // Create navigation menus table
  pgm.createTable("content_navigation", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true, unique: true },
    description: { type: "text" },
    location: { type: "varchar(50)" }, // E.g., 'header', 'footer', 'sidebar'
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for navigation
  pgm.createIndex("content_navigation", "slug");
  pgm.createIndex("content_navigation", "location");
  pgm.createIndex("content_navigation", "is_active");

  // Create navigation items table
  pgm.createTable("content_navigation_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    navigation_id: { type: "uuid", notNull: true, references: "content_navigation", onDelete: "CASCADE" },
    parent_id: { type: "uuid", references: "content_navigation_item" }, // For nested items
    title: { type: "varchar(255)", notNull: true },
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "url", 
      check: "type IN ('url', 'page', 'category', 'product', 'blog')" 
    },
    url: { type: "text" }, // For external links or custom URLs
    content_page_id: { type: "uuid", references: "content_page" }, // If linking to internal page
    target_id: { type: "uuid" }, // ID of target entity (product, category, etc.)
    target_slug: { type: "varchar(255)" }, // Slug of target entity
    icon: { type: "varchar(50)" }, // Icon for menu item
    css_classes: { type: "text" }, // Custom CSS classes
    open_in_new_tab: { type: "boolean", notNull: true, default: false },
    is_active: { type: "boolean", notNull: true, default: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    conditions: { type: "jsonb" }, // Conditional display rules (e.g., only show when logged in)
    depth: { type: "integer", notNull: true, default: 0 }, // Depth in menu hierarchy
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for navigation items
  pgm.createIndex("content_navigation_item", "navigation_id");
  pgm.createIndex("content_navigation_item", "parent_id");
  pgm.createIndex("content_navigation_item", "content_page_id");
  pgm.createIndex("content_navigation_item", "target_id");
  pgm.createIndex("content_navigation_item", "target_slug");
  pgm.createIndex("content_navigation_item", "is_active");
  pgm.createIndex("content_navigation_item", ["navigation_id", "sort_order"]);

  // Create content categories table
  pgm.createTable("content_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true },
    parent_id: { type: "uuid", references: "content_category" }, // For hierarchical categories
    description: { type: "text" },
    featured_image: { type: "text" },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    is_active: { type: "boolean", notNull: true, default: true },
    path: { type: "varchar(255)" }, // Full category path
    depth: { type: "integer", notNull: true, default: 0 }, // Depth in category hierarchy
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for content categories
  pgm.createIndex("content_category", "slug");
  pgm.createIndex("content_category", "parent_id");
  pgm.createIndex("content_category", "is_active");
  pgm.createIndex("content_category", "path");
  pgm.createIndex("content_category", ["parent_id", "slug"], { unique: true });

  // Create content categorization table
  pgm.createTable("content_categorization", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    content_page_id: { type: "uuid", notNull: true, references: "content_page", onDelete: "CASCADE" },
    category_id: { type: "uuid", notNull: true, references: "content_category", onDelete: "CASCADE" },
    is_primary: { type: "boolean", notNull: true, default: false }, // Whether this is the primary category
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for content categorization
  pgm.createIndex("content_categorization", "content_page_id");
  pgm.createIndex("content_categorization", "category_id");
  pgm.createIndex("content_categorization", ["content_page_id", "category_id"], { unique: true });

  // Add basic navigation menus
  pgm.sql(`
    INSERT INTO "content_navigation" ("name", "slug", "location") 
    VALUES 
      ('Main Menu', 'main-menu', 'header'),
      ('Footer Menu', 'footer-menu', 'footer'),
      ('Account Menu', 'account-menu', 'account')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("content_categorization");
  pgm.dropTable("content_category");
  pgm.dropTable("content_navigation_item");
  pgm.dropTable("content_navigation");
};
