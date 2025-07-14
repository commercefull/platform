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
  // Create media library table without the foreign key constraint first
  pgm.createTable("content_media", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    title: { type: "varchar(255)", notNull: true },
    file_name: { type: "varchar(255)", notNull: true },
    file_path: { type: "text", notNull: true },
    file_type: { type: "varchar(100)", notNull: true }, // MIME type
    file_size: { type: "integer", notNull: true }, // Size in bytes
    width: { type: "integer" }, // For images
    height: { type: "integer" }, // For images
    duration: { type: "integer" }, // For audio/video, in seconds
    alt_text: { type: "text" }, // For accessibility
    caption: { type: "text" },
    description: { type: "text" },
    folder_id: { type: "uuid" }, // Will add foreign key constraint later
    url: { type: "text", notNull: true }, // Public URL
    thumbnail_url: { type: "text" }, // Thumbnail version URL
    sort_order: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" }, // EXIF data, dimensions, etc.
    tags: { type: "text[]" }, // For media organization and search
    is_external: { type: "boolean", notNull: true, default: false }, // Whether stored externally (e.g., CDN)
    external_service: { type: "varchar(100)" }, // e.g., 'aws', 'cloudinary'
    external_id: { type: "varchar(255)" }, // ID in external service
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    updated_by: { type: "uuid" } // Reference to admin user
  });
  
  // Add the foreign key constraint after the folder table is created
  pgm.sql(`
    ALTER TABLE "content_media" 
    ADD CONSTRAINT fk_content_media_folder
    FOREIGN KEY (folder_id) 
    REFERENCES "content_media_folder"(id)
    ON DELETE SET NULL;
  `);

  // Create indexes for media library
  pgm.createIndex("content_media", "file_name");
  pgm.createIndex("content_media", "file_type");
  pgm.createIndex("content_media", "folder_id");
  pgm.createIndex("content_media", "tags");
  pgm.createIndex("content_media", "created_at");

  // Create media usage table to track where media is used
  pgm.createTable("content_media_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    media_id: { 
      type: "uuid", 
      notNull: true, 
      references: "content_media", 
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    entity_type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "entity_type IN ('content_page', 'content_block', 'product', 'category', 'merchant', 'blog')" 
    },
    entity_id: { type: "uuid", notNull: true }, // ID of the entity using the media
    field: { type: "varchar(100)" }, // Which field is using the media
    sort_order: { type: "integer", default: 0 }, // For multiple media items in the same field
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for media usage
  pgm.createIndex("content_media_usage", "media_id");
  pgm.createIndex("content_media_usage", ["entity_type", "entity_id"]);
  pgm.createIndex("content_media_usage", ["media_id", "entity_type", "entity_id", "field"], { 
    name: "idx_content_media_usage_unique_placement",
    unique: true 
  });

  // Create URL redirects table
  pgm.createTable("content_redirect", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    source_url: { 
      type: "text", 
      notNull: true,
      comment: 'The source URL pattern to match for redirection'
    },
    target_url: { 
      type: "text", 
      notNull: true,
      comment: 'The target URL to redirect to'
    },
    status_code: { 
      type: "integer", 
      notNull: true, 
      default: 301, 
      check: "status_code IN (301, 302, 303, 307, 308)",
      comment: 'HTTP status code to use for the redirect'
    },
    is_regex: { 
      type: "boolean", 
      notNull: true, 
      default: false,
      comment: 'Whether source_url is a regex pattern'
    },
    is_active: { 
      type: "boolean", 
      notNull: true, 
      default: true,
      comment: 'Whether this redirect is active'
    },
    hits: { 
      type: "integer", 
      notNull: true, 
      default: 0,
      comment: 'Count of times this redirect was used'
    },
    last_used: { 
      type: "timestamp",
      comment: 'When this redirect was last used'
    },
    notes: { 
      type: "text",
      comment: 'Administrative notes about this redirect'
    },
    created_at: { 
      type: "timestamp", 
      notNull: true, 
      default: pgm.func("current_timestamp"),
      comment: 'When this redirect was created'
    },
    updated_at: { 
      type: "timestamp", 
      notNull: true, 
      default: pgm.func("current_timestamp"),
      comment: 'When this redirect was last updated'
    },
    created_by: { 
      type: "uuid",
      comment: 'Reference to admin user who created this redirect'
    }, 
    updated_by: { 
      type: "uuid",
      comment: 'Reference to admin user who last updated this redirect'
    }
  });

  // Create indexes for redirects
  pgm.createIndex("content_redirect", "source_url", { 
    unique: true,
    name: 'idx_content_redirect_source_url_unique'
  });
  pgm.createIndex("content_redirect", "is_active");
  pgm.createIndex("content_redirect", "hits");

  // Create a unique index on sourceUrl for non-regex redirects
  pgm.createIndex("content_redirect", "source_url", { 
    unique: true,
    where: "is_regex = false"
  });

  // Create content tags table
  pgm.createTable("content_tag", {
    id: { 
      type: "uuid", 
      notNull: true, 
      default: pgm.func("uuid_generate_v4()"), 
      primaryKey: true 
    },
    name: { 
      type: "varchar(100)", 
      notNull: true,
      comment: 'The display name of the tag'
    },
    slug: { 
      type: "varchar(120)", 
      notNull: true,
      unique: true,
      comment: 'URL-friendly version of the tag name'
    },
    description: { 
      type: "text",
      comment: 'Optional description of the tag'
    },
    type: { 
      type: "varchar(50)",
      comment: 'For categorizing tags (e.g., category, topic, audience)'
    },
    metadata: { 
      type: "jsonb",
      comment: 'Additional metadata for the tag'
    },
    created_at: { 
      type: "timestamp", 
      notNull: true, 
      default: pgm.func("current_timestamp"),
      comment: 'When the tag was created'
    },
    updated_at: { 
      type: "timestamp", 
      notNull: true, 
      default: pgm.func("current_timestamp"),
      comment: 'When the tag was last updated'
    },
    created_by: { 
      type: "uuid",
      comment: 'Reference to admin user who created the tag'
    },
    updated_by: { 
      type: "uuid",
      comment: 'Reference to admin user who last updated the tag'
    }
  });

  // Create indexes for tags
  pgm.createIndex("content_tag", "name");
  pgm.createIndex("content_tag", "slug");
  pgm.createIndex("content_tag", "type");

  // Create content tagging table
  pgm.createTable("content_tagging", {
    id: { 
      type: "uuid", 
      notNull: true, 
      default: pgm.func("uuid_generate_v4()"), 
      primaryKey: true 
    },
    tag_id: { 
      type: "uuid", 
      notNull: true, 
      references: "content_tag", 
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      comment: 'Reference to the tag being applied'
    },
    entity_type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "entity_type IN ('content_page', 'content_block', 'product', 'category', 'merchant', 'blog')",
      comment: 'Type of the entity being tagged'
    },
    entity_id: { 
      type: "uuid", 
      notNull: true,
      comment: 'ID of the entity being tagged'
    },
    context: { 
      type: "varchar(100)",
      comment: 'For grouping tags in different contexts (e.g., primary, secondary)'
    },
    created_at: { 
      type: "timestamp", 
      notNull: true, 
      default: pgm.func("current_timestamp"),
      comment: 'When the tag was applied'
    },
    created_by: { 
      type: "uuid",
      comment: 'Reference to admin user who applied the tag'
    }
  });

  // Create indexes for tagging
  pgm.createIndex("content_tagging", "tag_id");
  pgm.createIndex("content_tagging", ["entity_type", "entity_id"]);
  pgm.createIndex("content_tagging", ["entity_type", "entity_id", "context"]);
  pgm.createIndex("content_tagging", ["tag_id", "entity_type", "entity_id", "context"], { 
    unique: true,
    name: 'idx_content_tagging_unique_application'
  });

  // Create root media folder
  pgm.sql(`
    INSERT INTO "content_media_folder" ("name", "path", "depth")
    VALUES ('Root', '/', 0)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order of dependencies to avoid foreign key constraint errors
  
  // First drop tables with foreign key references
  pgm.dropTable("content_redirect", { ifExists: true, cascade: true });
  
  // Drop content_tagging before content_tag due to foreign key
  pgm.dropTable("content_tagging", { ifExists: true, cascade: true });
  
  // Drop content_media_usage before content_media due to foreign key
  pgm.dropTable("content_media_usage", { ifExists: true, cascade: true });
  
  // Now drop the main tables
  pgm.dropTable("content_media", { ifExists: true, cascade: true });
  pgm.dropTable("content_tag", { ifExists: true, cascade: true });
  
  // Finally drop the folder table which has no dependencies
  pgm.dropTable("content_media_folder", { ifExists: true, cascade: true });
  
  // Note: cascade: true is used to ensure that if there are any remaining 
  // foreign key references, they will be automatically dropped.
  // This is safer than trying to manually drop all constraints first.
};
