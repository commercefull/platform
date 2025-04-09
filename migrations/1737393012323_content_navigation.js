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
    isActive: { type: "boolean", notNull: true, default: true },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for navigation
  pgm.createIndex("content_navigation", "slug");
  pgm.createIndex("content_navigation", "location");
  pgm.createIndex("content_navigation", "isActive");

  // Create navigation items table
  pgm.createTable("content_navigation_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    navigationId: { type: "uuid", notNull: true, references: "content_navigation", onDelete: "CASCADE" },
    parentId: { type: "uuid", references: "content_navigation_item" }, // For nested items
    title: { type: "varchar(255)", notNull: true },
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "url", 
      check: "type IN ('url', 'page', 'category', 'product', 'blog')" 
    },
    url: { type: "text" }, // For external links or custom URLs
    contentPageId: { type: "uuid", references: "content_page" }, // If linking to internal page
    targetId: { type: "uuid" }, // ID of target entity (product, category, etc.)
    targetSlug: { type: "varchar(255)" }, // Slug of target entity
    icon: { type: "varchar(50)" }, // Icon for menu item
    cssClasses: { type: "text" }, // Custom CSS classes
    openInNewTab: { type: "boolean", notNull: true, default: false },
    isActive: { type: "boolean", notNull: true, default: true },
    sortOrder: { type: "integer", notNull: true, default: 0 },
    conditions: { type: "jsonb" }, // Conditional display rules (e.g., only show when logged in)
    depth: { type: "integer", notNull: true, default: 0 }, // Depth in menu hierarchy
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for navigation items
  pgm.createIndex("content_navigation_item", "navigationId");
  pgm.createIndex("content_navigation_item", "parentId");
  pgm.createIndex("content_navigation_item", "contentPageId");
  pgm.createIndex("content_navigation_item", "targetId");
  pgm.createIndex("content_navigation_item", "targetSlug");
  pgm.createIndex("content_navigation_item", "isActive");
  pgm.createIndex("content_navigation_item", ["navigationId", "sortOrder"]);

  // Create content categories table
  pgm.createTable("content_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true },
    parentId: { type: "uuid", references: "content_category" }, // For hierarchical categories
    description: { type: "text" },
    featuredImage: { type: "text" },
    metaTitle: { type: "varchar(255)" },
    metaDescription: { type: "text" },
    sortOrder: { type: "integer", notNull: true, default: 0 },
    isActive: { type: "boolean", notNull: true, default: true },
    path: { type: "varchar(255)" }, // Full category path
    depth: { type: "integer", notNull: true, default: 0 }, // Depth in category hierarchy
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for content categories
  pgm.createIndex("content_category", "slug");
  pgm.createIndex("content_category", "parentId");
  pgm.createIndex("content_category", "isActive");
  pgm.createIndex("content_category", "path");
  pgm.createIndex("content_category", ["parentId", "slug"], { unique: true });

  // Create content categorization table
  pgm.createTable("content_categorization", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    contentPageId: { type: "uuid", notNull: true, references: "content_page", onDelete: "CASCADE" },
    categoryId: { type: "uuid", notNull: true, references: "content_category", onDelete: "CASCADE" },
    isPrimary: { type: "boolean", notNull: true, default: false }, // Whether this is the primary category
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for content categorization
  pgm.createIndex("content_categorization", "contentPageId");
  pgm.createIndex("content_categorization", "categoryId");
  pgm.createIndex("content_categorization", ["contentPageId", "categoryId"], { unique: true });

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
