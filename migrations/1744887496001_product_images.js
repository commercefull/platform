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
    // Create product_image table with snake_case naming to match convention
    pgm.createTable("product_image", {
        id: {
            type: "uuid",
            notNull: true,
            default: pgm.func("uuid_generate_v4()"),
            primaryKey: true,
        },
        product_id: {
            type: "uuid",
            notNull: true,
            references: "product(id)",
            onDelete: "CASCADE",
        },
        variant_id: {
            type: "uuid",
            references: "product_variant(id)", // Use snake_case table name
            onDelete: "SET NULL",
        },
        url: { type: "varchar(2048)", notNull: true },
        alt: { type: "varchar(255)" },
        title: { type: "varchar(255)" },
        position: { type: "integer", notNull: true, default: 0 },
        width: { type: "integer" },
        height: { type: "integer" },
        size: { type: "integer" },
        type: { type: "varchar(50)" },
        is_primary: { type: "boolean", notNull: true, default: false },
        is_visible: { type: "boolean", notNull: true, default: true },
        metadata: { type: "jsonb" },
        created_at: { 
            type: "timestamp", 
            notNull: true, 
            default: pgm.func("current_timestamp") 
        },
        updated_at: { 
            type: "timestamp", 
            notNull: true, 
            default: pgm.func("current_timestamp") 
        },
        deleted_at: { type: "timestamp" }
    });

    // Create indexes
    pgm.createIndex("product_image", "product_id");
    pgm.createIndex("product_image", "variant_id");
    pgm.createIndex("product_image", "is_primary");
    pgm.createIndex("product_image", "is_visible");
    pgm.createIndex("product_image", "position");
    pgm.createIndex("product_image", ["product_id", "position"]);
    pgm.createIndex("product_image", "deleted_at");

    // Add primary_image_id column to product table
    pgm.addColumn("product", {
        primary_image_id: {
            type: "uuid",
            references: "product_image(id)",
            onDelete: "SET NULL",
        }
    });
    
    // Create index on primary_image_id in product table
    pgm.createIndex("product", "primary_image_id");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropColumn("product", "primary_image_id");
    pgm.dropTable("product_image");
};
