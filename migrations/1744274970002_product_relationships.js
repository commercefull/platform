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
  // Create product review table
  pgm.createTable("product_review", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    customerId: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    orderId: { type: "uuid", references: "order" }, // Reference to purchase order
    rating: { type: "integer", notNull: true, check: "rating >= 1 AND rating <= 5" },
    title: { type: "varchar(255)" },
    content: { type: "text" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'approved', 'rejected', 'spam')",
      default: "'pending'"
    },
    isVerifiedPurchase: { type: "boolean", notNull: true, default: false },
    isHighlighted: { type: "boolean", notNull: true, default: false },
    helpfulCount: { type: "integer", notNull: true, default: 0 },
    unhelpfulCount: { type: "integer", notNull: true, default: 0 },
    reportCount: { type: "integer", notNull: true, default: 0 },
    reviewerName: { type: "varchar(255)" }, // Name of reviewer (may be anonymous)
    reviewerEmail: { type: "varchar(255)" }, // Email of reviewer (private)
    adminResponse: { type: "text" }, // Response from merchant/admin
    adminResponseDate: { type: "timestamp" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product reviews
  pgm.createIndex("product_review", "productId");
  pgm.createIndex("product_review", "variantId");
  pgm.createIndex("product_review", "customerId");
  pgm.createIndex("product_review", "orderId");
  pgm.createIndex("product_review", "rating");
  pgm.createIndex("product_review", "status");
  pgm.createIndex("product_review", "isVerifiedPurchase");
  pgm.createIndex("product_review", "isHighlighted");
  pgm.createIndex("product_review", "createdAt");

  // Create product review media table
  pgm.createTable("product_review_media", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    reviewId: { type: "uuid", notNull: true, references: "product_review", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('image', 'video')" 
    },
    url: { type: "text", notNull: true },
    filename: { type: "varchar(255)" },
    filesize: { type: "integer" },
    mimeType: { type: "varchar(100)" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'approved', 'rejected')",
      default: "'pending'"
    },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product review media
  pgm.createIndex("product_review_media", "reviewId");
  pgm.createIndex("product_review_media", "type");
  pgm.createIndex("product_review_media", "status");

  // Create product review vote table for "Was this review helpful?"
  pgm.createTable("product_review_vote", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    reviewId: { type: "uuid", notNull: true, references: "product_review", onDelete: "CASCADE" },
    customerId: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    sessionId: { type: "varchar(255)" }, // For non-logged in users
    isHelpful: { type: "boolean", notNull: true },
    ipAddress: { type: "inet" },
    userAgent: { type: "text" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product review votes
  pgm.createIndex("product_review_vote", "reviewId");
  pgm.createIndex("product_review_vote", "customerId");
  pgm.createIndex("product_review_vote", "sessionId");
  pgm.createIndex("product_review_vote", "isHelpful");
  pgm.createIndex("product_review_vote", ["reviewId", "customerId"], {
    unique: true,
    where: "customerId IS NOT NULL"
  });
  pgm.createIndex("product_review_vote", ["reviewId", "sessionId"], {
    unique: true,
    where: "sessionId IS NOT NULL AND customerId IS NULL"
  });

  // Create product related items table
  pgm.createTable("product_related", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    relatedProductId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('related', 'upsell', 'cross_sell', 'accessory', 'similar', 'bought_together', 'alternative')",
      default: "'related'"
    },
    position: { type: "integer", notNull: true, default: 0 },
    isAutomated: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product related items
  pgm.createIndex("product_related", "productId");
  pgm.createIndex("product_related", "relatedProductId");
  pgm.createIndex("product_related", "type");
  pgm.createIndex("product_related", "position");
  pgm.createIndex("product_related", "isAutomated");
  pgm.createIndex("product_related", ["productId", "relatedProductId", "type"], { unique: true });

  // Create product question and answer table
  pgm.createTable("product_qa", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    customerId: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    question: { type: "text", notNull: true },
    askerName: { type: "varchar(255)" },
    askerEmail: { type: "varchar(255)" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'published', 'rejected', 'answered')",
      default: "'pending'"
    },
    isAnonymous: { type: "boolean", notNull: true, default: false },
    helpfulCount: { type: "integer", notNull: true, default: 0 },
    viewCount: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product Q&A
  pgm.createIndex("product_qa", "productId");
  pgm.createIndex("product_qa", "customerId");
  pgm.createIndex("product_qa", "status");
  pgm.createIndex("product_qa", "helpfulCount");
  pgm.createIndex("product_qa", "createdAt");

  // Create product answer table
  pgm.createTable("product_qa_answer", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    questionId: { type: "uuid", notNull: true, references: "product_qa", onDelete: "CASCADE" },
    answer: { type: "text", notNull: true },
    userId: { type: "uuid" }, // Admin or merchant user
    customerId: { type: "uuid", references: "customer", onDelete: "SET NULL" }, // If answered by customer
    responderName: { type: "varchar(255)" },
    isVerified: { type: "boolean", notNull: true, default: false }, // Official answer from merchant
    helpfulCount: { type: "integer", notNull: true, default: 0 },
    unhelpfulCount: { type: "integer", notNull: true, default: 0 },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'published', 'rejected')",
      default: "'pending'"
    },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product Q&A answers
  pgm.createIndex("product_qa_answer", "questionId");
  pgm.createIndex("product_qa_answer", "userId");
  pgm.createIndex("product_qa_answer", "customerId");
  pgm.createIndex("product_qa_answer", "isVerified");
  pgm.createIndex("product_qa_answer", "status");
  pgm.createIndex("product_qa_answer", "helpfulCount");
  pgm.createIndex("product_qa_answer", "createdAt");

  // Create product Q&A vote table
  pgm.createTable("product_qa_vote", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    questionId: { type: "uuid", references: "product_qa", onDelete: "CASCADE" },
    answerId: { type: "uuid", references: "product_qa_answer", onDelete: "CASCADE" },
    customerId: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    sessionId: { type: "varchar(255)" }, // For non-logged in users
    isHelpful: { type: "boolean", notNull: true },
    ipAddress: { type: "inet" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product Q&A votes
  pgm.createIndex("product_qa_vote", "questionId");
  pgm.createIndex("product_qa_vote", "answerId");
  pgm.createIndex("product_qa_vote", "customerId");
  pgm.createIndex("product_qa_vote", "sessionId");
  pgm.createIndex("product_qa_vote", "isHelpful");
  pgm.createIndex("product_qa_vote", ["questionId", "customerId"], {
    where: "questionId IS NOT NULL AND customerId IS NOT NULL"
  });
  pgm.createIndex("product_qa_vote", ["answerId", "customerId"], {
    where: "answerId IS NOT NULL AND customerId IS NOT NULL"
  });
  pgm.createIndex("product_qa_vote", ["questionId", "sessionId"], {
    where: "questionId IS NOT NULL AND sessionId IS NOT NULL AND customerId IS NULL"
  });
  pgm.createIndex("product_qa_vote", ["answerId", "sessionId"], {
    where: "answerId IS NOT NULL AND sessionId IS NOT NULL AND customerId IS NULL"
  });

  // Create product list table (wishlists, favorites, etc.)
  pgm.createTable("product_list", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('wishlist', 'favorites', 'save_for_later', 'custom')",
      default: "'wishlist'"
    },
    isDefault: { type: "boolean", notNull: true, default: false },
    isPublic: { type: "boolean", notNull: true, default: false },
    description: { type: "text" },
    shareUrl: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product lists
  pgm.createIndex("product_list", "customerId");
  pgm.createIndex("product_list", "type");
  pgm.createIndex("product_list", "isDefault");
  pgm.createIndex("product_list", "isPublic");
  pgm.createIndex("product_list", ["customerId", "type", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create product list item table
  pgm.createTable("product_list_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    listId: { type: "uuid", notNull: true, references: "product_list", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    addedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    quantity: { type: "integer", notNull: true, default: 1 },
    notes: { type: "text" },
    priority: { 
      type: "varchar(50)", 
      check: "priority IN ('low', 'medium', 'high')",
      default: "'medium'"
    },
    metadata: { type: "jsonb" }
  });

  // Create indexes for product list items
  pgm.createIndex("product_list_item", "listId");
  pgm.createIndex("product_list_item", "productId");
  pgm.createIndex("product_list_item", "variantId");
  pgm.createIndex("product_list_item", "addedAt");
  pgm.createIndex("product_list_item", "priority");
  pgm.createIndex("product_list_item", ["listId", "productId", "variantId"], { 
    unique: true,
    where: "variantId IS NOT NULL"
  });
  pgm.createIndex("product_list_item", ["listId", "productId"], { 
    unique: true,
    where: "variantId IS NULL"
  });

  // Insert sample product review
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
      sample_variant AS (SELECT id FROM "productVariant" WHERE sku = 'TG-BH-001-BLK' LIMIT 1),
      sample_customer AS (
        -- Try to select a customer, but don't fail if none exists
        SELECT id FROM customer LIMIT 1
      )
    INSERT INTO product_review (
      productId,
      variantId,
      customerId,
      rating,
      title,
      content,
      status,
      isVerifiedPurchase,
      isHighlighted,
      reviewerName
    )
    VALUES (
      (SELECT id FROM sample_product),
      (SELECT id FROM sample_variant),
      (SELECT id FROM sample_customer),
      5,
      'Amazing Sound Quality!',
      'These headphones are incredible. The sound quality is crystal clear, and the noise cancellation works perfectly. Battery life is impressive too - I can use them for an entire day without needing to recharge. Very comfortable to wear for long periods.',
      'approved',
      true,
      true,
      'John D.'
    ),
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM sample_variant),
      (SELECT id FROM sample_customer),
      4,
      'Great headphones, but the app needs work',
      'The headphones themselves are excellent - comfortable and great sound. The only reason I gave 4 stars instead of 5 is that the companion app is a bit buggy. Sometimes it disconnects and I have to restart it. Otherwise, very satisfied with my purchase.',
      'approved',
      true,
      false,
      'Sarah M.'
    );
  `);

  // Insert sample related products
  pgm.sql(`
    -- This is just a placeholder. In a real migration, you'd relate real products
    -- Since we only have one sample product, we're just setting up the structure
    WITH sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1)
    INSERT INTO product_related (
      productId,
      relatedProductId,
      type,
      position,
      isAutomated
    )
    VALUES (
      (SELECT id FROM sample_product),
      (SELECT id FROM sample_product),
      'accessory',
      1,
      true
    );
  `);

  // Insert sample Q&A
  pgm.sql(`
    WITH sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1)
    INSERT INTO product_qa (
      productId,
      question,
      askerName,
      status,
      isAnonymous
    )
    VALUES (
      (SELECT id FROM sample_product),
      'Are these headphones compatible with iPhone 15?',
      'Mike T.',
      'answered',
      false
    );
  `);

  // Insert sample Q&A answer
  pgm.sql(`
    WITH 
      sample_question AS (SELECT id FROM product_qa WHERE question = 'Are these headphones compatible with iPhone 15?' LIMIT 1)
    INSERT INTO product_qa_answer (
      questionId,
      answer,
      responderName,
      isVerified,
      status
    )
    VALUES (
      (SELECT id FROM sample_question),
      'Yes, these headphones are fully compatible with iPhone 15 and all other Bluetooth-enabled devices. They use Bluetooth 5.2 technology for a stable connection.',
      'TechGear Support',
      true,
      'published'
    );
  `);

  // Insert sample wishlist
  pgm.sql(`
    WITH 
      sample_customer AS (
        -- Try to select a customer, but don't fail if none exists
        SELECT id FROM customer LIMIT 1
      )
    INSERT INTO product_list (
      customerId,
      name,
      type,
      isDefault,
      isPublic,
      description
    )
    SELECT
      id,
      'My Wishlist',
      'wishlist',
      true,
      false,
      'Products I want to purchase in the future'
    FROM sample_customer
    WHERE id IS NOT NULL;
  `);

  // Insert sample wishlist item
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
      sample_list AS (SELECT id FROM product_list WHERE name = 'My Wishlist' LIMIT 1)
    INSERT INTO product_list_item (
      listId,
      productId,
      quantity,
      priority
    )
    SELECT
      (SELECT id FROM sample_list),
      (SELECT id FROM sample_product),
      1,
      'high'
    WHERE (SELECT id FROM sample_list) IS NOT NULL;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("product_list_item");
  pgm.dropTable("product_list");
  pgm.dropTable("product_qa_vote");
  pgm.dropTable("product_qa_answer");
  pgm.dropTable("product_qa");
  pgm.dropTable("product_related");
  pgm.dropTable("product_review_vote");
  pgm.dropTable("product_review_media");
  pgm.dropTable("product_review");
};
