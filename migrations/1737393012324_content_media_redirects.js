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
  // Create media library table
  pgm.createTable("content_media", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    title: { type: "varchar(255)", notNull: true },
    fileName: { type: "varchar(255)", notNull: true },
    filePath: { type: "text", notNull: true },
    fileType: { type: "varchar(100)", notNull: true }, // MIME type
    fileSize: { type: "integer", notNull: true }, // Size in bytes
    width: { type: "integer" }, // For images
    height: { type: "integer" }, // For images
    duration: { type: "integer" }, // For audio/video, in seconds
    altText: { type: "text" }, // For accessibility
    caption: { type: "text" },
    description: { type: "text" },
    folderId: { type: "uuid", references: "content_media_folder" }, // For organizing media
    url: { type: "text", notNull: true }, // Public URL
    thumbnailUrl: { type: "text" }, // Thumbnail version URL
    sortOrder: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" }, // EXIF data, dimensions, etc.
    tags: { type: "text[]" }, // For media organization and search
    isExternal: { type: "boolean", notNull: true, default: false }, // Whether stored externally (e.g., CDN)
    externalService: { type: "varchar(100)" }, // e.g., 'aws', 'cloudinary'
    externalId: { type: "varchar(255)" }, // ID in external service
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for media library
  pgm.createIndex("content_media", "fileName");
  pgm.createIndex("content_media", "fileType");
  pgm.createIndex("content_media", "folderId");
  pgm.createIndex("content_media", "tags");
  pgm.createIndex("content_media", "created_at");

  // Create media folders table
  pgm.createTable("content_media_folder", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    parentId: { type: "uuid", references: "content_media_folder" }, // For nested folders
    path: { type: "varchar(255)" }, // Full folder path
    depth: { type: "integer", notNull: true, default: 0 }, // Depth in folder hierarchy
    sortOrder: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for media folders
  pgm.createIndex("content_media_folder", "parentId");
  pgm.createIndex("content_media_folder", "path");
  pgm.createIndex("content_media_folder", ["parentId", "name"], { unique: true });

  // Create media usage table to track where media is used
  pgm.createTable("content_media_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    mediaId: { type: "uuid", notNull: true, references: "content_media", onDelete: "CASCADE" },
    entityType: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "entityType IN ('content_page', 'content_block', 'product', 'category', 'merchant', 'blog')" 
    },
    entityId: { type: "uuid", notNull: true }, // ID of the entity using the media
    field: { type: "varchar(100)" }, // Which field is using the media
    sortOrder: { type: "integer", default: 0 }, // For multiple media items in the same field
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for media usage
  pgm.createIndex("content_media_usage", "mediaId");
  pgm.createIndex("content_media_usage", ["entityType", "entityId"]);
  pgm.createIndex("content_media_usage", ["mediaId", "entityType", "entityId", "field"], { unique: true });

  // Create URL redirects table
  pgm.createTable("content_redirect", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    sourceUrl: { type: "text", notNull: true },
    targetUrl: { type: "text", notNull: true },
    statusCode: { type: "integer", notNull: true, default: 301, check: "statusCode IN (301, 302, 303, 307, 308)" },
    isRegex: { type: "boolean", notNull: true, default: false }, // Whether sourceUrl is a regex pattern
    isActive: { type: "boolean", notNull: true, default: true },
    hits: { type: "integer", notNull: true, default: 0 }, // Count of times this redirect was used
    lastUsed: { type: "timestamp" },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // Reference to admin user
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for redirects
  pgm.createIndex("content_redirect", "sourceUrl");
  pgm.createIndex("content_redirect", "isActive");
  pgm.createIndex("content_redirect", "hits");

  // Create a unique index on sourceUrl for non-regex redirects
  pgm.createIndex("content_redirect", "sourceUrl", { 
    unique: true,
    where: "isRegex = false"
  });

  // Create content tags table
  pgm.createTable("content_tag", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", notNull: true, unique: true },
    description: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tags
  pgm.createIndex("content_tag", "name");
  pgm.createIndex("content_tag", "slug");

  // Create content tagging table for associating tags with content
  pgm.createTable("content_tagging", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    tagId: { type: "uuid", notNull: true, references: "content_tag", onDelete: "CASCADE" },
    entityType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "entityType IN ('content_page', 'product', 'category', 'blog')" 
    },
    entityId: { type: "uuid", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tagging
  pgm.createIndex("content_tagging", "tagId");
  pgm.createIndex("content_tagging", ["entityType", "entityId"]);
  pgm.createIndex("content_tagging", ["tagId", "entityType", "entityId"], { unique: true });

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
  pgm.dropTable("content_tagging");
  pgm.dropTable("content_tag");
  pgm.dropTable("content_redirect");
  pgm.dropTable("content_media_usage");
  pgm.dropTable("content_media");
  pgm.dropTable("content_media_folder");
};
