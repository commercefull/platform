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
  // Create content templates table for defining page layouts and structure
  pgm.createTable("content_template", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true, unique: true },
    description: { type: "text" },
    thumbnail: { type: "text" }, // URL to template preview image
    html_structure: { type: "text" }, // Base HTML structure with placeholders for blocks
    css_styles: { type: "text" }, // Custom CSS for this template
    js_scripts: { type: "text" }, // Custom JS for this template
    areas: { type: "jsonb" }, // Defines layout areas (e.g., header, main, sidebar, footer)
    default_blocks: { type: "jsonb" }, // Default blocks configuration when template is selected
    compatible_content_types: { type: "text[]" }, // Which content types can use this template
    is_system: { type: "boolean", notNull: true, default: false }, // System templates cannot be deleted
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for templates
  pgm.createIndex("content_template", "slug");
  pgm.createIndex("content_template", "is_active");

  // Now update the foreign key for default templates in content_type
  pgm.addConstraint("content_type", "content_type_default_template_fkey", {
    foreignKeys: {
      columns: "default_template",
      references: "content_template(id)",
      onDelete: "SET NULL"
    }
  });

  // Add basic system templates
  pgm.sql(`
    INSERT INTO "content_template" ("name", "slug", "description", "is_system", "areas") 
    VALUES 
      ('Standard Page', 'standard-page', 'Default single column page layout', true, '{"areas": ["main"]}'),
      ('Blog Post', 'blog-post', 'Standard blog post layout with featured image', true, '{"areas": ["featured", "main", "sidebar"]}'),
      ('Two Column', 'two-column', 'Two column layout with sidebar', true, '{"areas": ["header", "main", "sidebar", "footer"]}'),
      ('Landing Page', 'landing-page', 'Full width marketing landing page', true, '{"areas": ["header", "main", "cta", "footer"]}'),
      ('Product Detail', 'product-detail', 'Product detail page with image gallery', true, '{"areas": ["images", "details", "description", "related"]}')
  `);

  // Update the default templates for content types
  pgm.sql(`
    UPDATE "content_type" as ct
    SET "default_template" = (SELECT id FROM "content_template" WHERE slug = 'standard-page')
    WHERE ct.slug = 'page';

    UPDATE "content_type" as ct
    SET "default_template" = (SELECT id FROM "content_template" WHERE slug = 'blog-post')
    WHERE ct.slug = 'blog-post';

    UPDATE "content_type" as ct
    SET "default_template" = (SELECT id FROM "content_template" WHERE slug = 'product-detail')
    WHERE ct.slug = 'product-page';

    UPDATE "content_type" as ct
    SET "default_template" = (SELECT id FROM "content_template" WHERE slug = 'two-column')
    WHERE ct.slug = 'category-page';

    UPDATE "content_type" as ct
    SET "default_template" = (SELECT id FROM "content_template" WHERE slug = 'landing-page')
    WHERE ct.slug = 'landing-page';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove the foreign key constraint first
  pgm.dropConstraint("content_type", "content_type_default_template_fkey");
  
  // Then drop the table
  pgm.dropTable("content_template");
};
