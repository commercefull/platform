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
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    customer_id: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    order_id: { type: "uuid", references: "order" }, // Reference to purchase order
    rating: { type: "integer", notNull: true, check: "rating >= 1 AND rating <= 5" },
    title: { type: "varchar(255)" },
    content: { type: "text" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'approved', 'rejected', 'spam')",
      default: "'pending'"
    },
    is_verified_purchase: { type: "boolean", notNull: true, default: false },
    is_highlighted: { type: "boolean", notNull: true, default: false },
    helpful_count: { type: "integer", notNull: true, default: 0 },
    unhelpful_count: { type: "integer", notNull: true, default: 0 },
    report_count: { type: "integer", notNull: true, default: 0 },
    reviewer_name: { type: "varchar(255)" }, // Name of reviewer (may be anonymous)
    reviewer_email: { type: "varchar(255)" }, // Email of reviewer (private)
    admin_response: { type: "text" }, // Response from merchant/admin
    admin_response_date: { type: "timestamp" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product reviews
  pgm.createIndex("product_review", "product_id");
  pgm.createIndex("product_review", "variant_id");
  pgm.createIndex("product_review", "customer_id");
  pgm.createIndex("product_review", "order_id");
  pgm.createIndex("product_review", "rating");
  pgm.createIndex("product_review", "status");
  pgm.createIndex("product_review", "is_verified_purchase");
  pgm.createIndex("product_review", "is_highlighted");
  pgm.createIndex("product_review", "created_at");

  // Create product review media table
  pgm.createTable("product_review_media", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    review_id: { type: "uuid", notNull: true, references: "product_review", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('image', 'video')" 
    },
    url: { type: "text", notNull: true },
    filename: { type: "varchar(255)" },
    filesize: { type: "integer" },
    mime_type: { type: "varchar(100)" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'approved', 'rejected')",
      default: "'pending'"
    },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product review media
  pgm.createIndex("product_review_media", "review_id");
  pgm.createIndex("product_review_media", "type");
  pgm.createIndex("product_review_media", "status");

  // Create product review vote table for "Was this review helpful?"
  pgm.createTable("product_review_vote", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    review_id: { type: "uuid", notNull: true, references: "product_review", onDelete: "CASCADE" },
    customer_id: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    session_id: { type: "varchar(255)" }, // For non-logged in users
    is_helpful: { type: "boolean", notNull: true },
    ip_address: { type: "inet" },
    user_agent: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product review votes
  pgm.createIndex("product_review_vote", "review_id");
  pgm.createIndex("product_review_vote", "customer_id");
  pgm.createIndex("product_review_vote", "session_id");
  pgm.createIndex("product_review_vote", "is_helpful");
  pgm.createIndex("product_review_vote", ["review_id", "customer_id"], {
    unique: true,
    where: "customer_id IS NOT NULL"
  });
  pgm.createIndex("product_review_vote", ["review_id", "session_id"], {
    unique: true,
    where: "session_id IS NOT NULL AND customer_id IS NULL"
  });

  // Create product related items table
  pgm.createTable("product_related", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    related_product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('related', 'upsell', 'cross_sell', 'accessory', 'similar', 'bought_together', 'alternative')",
      default: "'related'"
    },
    position: { type: "integer", notNull: true, default: 0 },
    is_automated: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product related items
  pgm.createIndex("product_related", "product_id");
  pgm.createIndex("product_related", "related_product_id");
  pgm.createIndex("product_related", "type");
  pgm.createIndex("product_related", "position");
  pgm.createIndex("product_related", "is_automated");
  pgm.createIndex("product_related", ["product_id", "related_product_id", "type"], { unique: true });

  // Create product question and answer table
  pgm.createTable("product_qa", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    customer_id: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    question: { type: "text", notNull: true },
    asker_name: { type: "varchar(255)" },
    asker_email: { type: "varchar(255)" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'published', 'rejected', 'answered')",
      default: "'pending'"
    },
    is_anonymous: { type: "boolean", notNull: true, default: false },
    helpful_count: { type: "integer", notNull: true, default: 0 },
    view_count: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product Q&A
  pgm.createIndex("product_qa", "product_id");
  pgm.createIndex("product_qa", "customer_id");
  pgm.createIndex("product_qa", "status");
  pgm.createIndex("product_qa", "helpful_count");
  pgm.createIndex("product_qa", "created_at");

  // Create product answer table
  pgm.createTable("product_qa_answer", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    question_id: { type: "uuid", notNull: true, references: "product_qa", onDelete: "CASCADE" },
    answer: { type: "text", notNull: true },
    user_id: { type: "uuid" }, // Admin or merchant user
    customer_id: { type: "uuid", references: "customer", onDelete: "SET NULL" }, // If answered by customer
    responder_name: { type: "varchar(255)" },
    is_verified: { type: "boolean", notNull: true, default: false }, // Official answer from merchant
    helpful_count: { type: "integer", notNull: true, default: 0 },
    unhelpful_count: { type: "integer", notNull: true, default: 0 },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'published', 'rejected')",
      default: "'pending'"
    },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product Q&A answers
  pgm.createIndex("product_qa_answer", "question_id");
  pgm.createIndex("product_qa_answer", "user_id");
  pgm.createIndex("product_qa_answer", "customer_id");
  pgm.createIndex("product_qa_answer", "is_verified");
  pgm.createIndex("product_qa_answer", "status");
  pgm.createIndex("product_qa_answer", "helpful_count");
  pgm.createIndex("product_qa_answer", "created_at");

  // Create product Q&A vote table
  pgm.createTable("product_qa_vote", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    question_id: { type: "uuid", references: "product_qa", onDelete: "CASCADE" },
    answer_id: { type: "uuid", references: "product_qa_answer", onDelete: "CASCADE" },
    customer_id: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    session_id: { type: "varchar(255)" }, // For non-logged in users
    is_helpful: { type: "boolean", notNull: true },
    ip_address: { type: "inet" },
    user_agent: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product Q&A votes
  pgm.createIndex("product_qa_vote", "question_id");
  pgm.createIndex("product_qa_vote", "answer_id");
  pgm.createIndex("product_qa_vote", "customer_id");
  pgm.createIndex("product_qa_vote", "session_id");
  pgm.createIndex("product_qa_vote", "is_helpful");
  pgm.createIndex("product_qa_vote", ["question_id", "customer_id"], {
    unique: true,
    where: "customer_id IS NOT NULL AND answer_id IS NULL"
  });
  pgm.createIndex("product_qa_vote", ["answer_id", "customer_id"], {
    unique: true,
    where: "customer_id IS NOT NULL AND answer_id IS NOT NULL"
  });
  pgm.createIndex("product_qa_vote", ["question_id", "session_id"], {
    unique: true,
    where: "session_id IS NOT NULL AND customer_id IS NULL AND answer_id IS NULL"
  });
  pgm.createIndex("product_qa_vote", ["answer_id", "session_id"], {
    unique: true,
    where: "session_id IS NOT NULL AND customer_id IS NULL AND answer_id IS NOT NULL"
  });

  // Create product list table (wishlists, favorites, etc.)
  pgm.createTable("product_list", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('wishlist', 'favorites', 'save_for_later', 'custom')",
      default: "'wishlist'"
    },
    is_default: { type: "boolean", notNull: true, default: false },
    is_public: { type: "boolean", notNull: true, default: false },
    description: { type: "text" },
    share_url: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product lists
  pgm.createIndex("product_list", "customer_id");
  pgm.createIndex("product_list", "type");
  pgm.createIndex("product_list", "is_default");
  pgm.createIndex("product_list", "is_public");
  pgm.createIndex("product_list", ["customer_id", "type", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Create product list item table
  pgm.createTable("product_list_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    list_id: { type: "uuid", notNull: true, references: "product_list", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    added_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
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
  pgm.createIndex("product_list_item", "list_id");
  pgm.createIndex("product_list_item", "product_id");
  pgm.createIndex("product_list_item", "variant_id");
  pgm.createIndex("product_list_item", "added_at");
  pgm.createIndex("product_list_item", "priority");
  pgm.createIndex("product_list_item", ["list_id", "product_id", "variant_id"], { 
    unique: true,
    where: "variant_id IS NOT NULL"
  });
  pgm.createIndex("product_list_item", ["list_id", "product_id"], { 
    unique: true,
    where: "variant_id IS NULL"
  });

  // Insert sample product review
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
      sample_variant AS (SELECT id FROM "product_variant" WHERE sku = 'TG-BH-001-BLK' LIMIT 1),
      sample_customer AS (
        -- Try to select a customer, but don't fail if none exists
        SELECT id FROM customer LIMIT 1
      )
    INSERT INTO product_review (
      product_id,
      variant_id,
      customer_id,
      rating,
      title,
      content,
      status,
      is_verified_purchase,
      is_highlighted,
      reviewer_name
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
      product_id,
      related_product_id,
      type,
      position,
      is_automated
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
      product_id,
      question,
      asker_name,
      status,
      is_anonymous
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
      question_id,
      answer,
      responder_name,
      is_verified,
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
      customer_id,
      name,
      type,
      is_default,
      is_public,
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
      list_id,
      product_id,
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
