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
    // Create enum for inventory policy
    pgm.createType("inventory_policy", ["deny", "continue", "backorder"]);

    // Check if productVariant table exists and add new columns
    pgm.addColumns("productVariant", {
        name: { 
            type: "varchar(255)",
            notNull: false // Making it not required for existing records
        },
        salePrice: { type: "numeric(15,2)" },
        cost: { type: "numeric(15,2)" },
        inventory: { 
            type: "integer",
            notNull: false,
            default: 0
        },
        inventoryPolicy: { 
            type: "inventory_policy", 
            notNull: false, 
            default: "deny"
        },
        weight: { type: "numeric(10,2)" },
        dimensions: { type: "jsonb" },
        attributes: { 
            type: "jsonb",
            notNull: false,
            default: pgm.func("'{}'::jsonb") 
        },
        imageIds: { type: "uuid[]" },
        isDefault: { 
            type: "boolean",
            notNull: false,
            default: false 
        },
        isActive: { 
            type: "boolean",
            notNull: false,
            default: true 
        },
        position: { 
            type: "integer",
            notNull: false,
            default: 0 
        },
        metadata: { type: "jsonb" },
        deletedAt: { 
            type: "timestamp",
            notNull: false
        }
    });

    // Create indexes for new columns
    pgm.createIndex("productVariant", "isDefault");
    pgm.createIndex("productVariant", "isActive");
    pgm.createIndex("productVariant", "position");
    pgm.createIndex("productVariant", ["productId", "position"]);
    pgm.createIndex("productVariant", "name");
    pgm.createIndex("productVariant", "deletedAt");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropColumns("productVariant", [
        "name",
        "salePrice",
        "cost",
        "inventory",
        "inventoryPolicy",
        "weight",
        "dimensions",
        "attributes",
        "imageIds",
        "isDefault",
        "isActive",
        "position",
        "metadata",
        "deletedAt"
    ], { ifExists: true });
    
    pgm.dropType("inventory_policy", { ifExists: true });
};
