/**
 * Recommendation module tables.
 *
 * Raw signal stores (co-purchase, co-view, per-product stats, tenant stats,
 * processed-order ledger) are updated incrementally by event handlers.
 * Read models (recommendationCandidate, recommendationPopular) are rebuilt
 * nightly for cheap serving.
 *
 * See docs/modules/recommendation.md.
 *
 * storeId is NOT NULL: the all-stores sentinel avoids nullable-unique
 * semantics, so plain unique constraints work everywhere.
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  await knex.schema.createTable('recommendationCoPurchase', t => {
    t.uuid('recommendationCoPurchaseId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.uuid('relatedProductId').notNullable();
    t.decimal('coCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeCoCount').notNullable().defaultTo(0);
    t.timestamp('lastOrderedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.unique(['organizationId', 'storeId', 'productId', 'relatedProductId'], { indexName: 'uq_recoCoPurchase_pair' });
    t.index(['organizationId', 'productId'], 'idx_recoCoPurchase_org_product');
    t.index(['organizationId', 'productId', 'coCount'], 'idx_recoCoPurchase_rank');
  });

  await knex.schema.createTable('recommendationCoView', t => {
    t.uuid('recommendationCoViewId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.uuid('relatedProductId').notNullable();
    t.decimal('coViewCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeCoViewCount').notNullable().defaultTo(0);
    t.timestamp('lastViewedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId', 'relatedProductId'], { indexName: 'uq_recoCoView_pair' });
    t.index(['organizationId', 'productId'], 'idx_recoCoView_org_product');
  });

  await knex.schema.createTable('recommendationProductStat', t => {
    t.uuid('recommendationProductStatId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.decimal('orderCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeOrderCount').notNullable().defaultTo(0);
    t.timestamp('lastOrderedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId'], { indexName: 'uq_recoProductStat' });
    t.index(['organizationId', 'orderCount'], 'idx_recoProductStat_org_count');
  });

  await knex.schema.createTable('recommendationTenantStat', t => {
    t.uuid('recommendationTenantStatId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.decimal('totalOrders', 14, 4).notNullable().defaultTo(0);
    t.timestamp('lastRebuiltAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId'], { indexName: 'uq_recoTenantStat' });
  });

  await knex.schema.createTable('recommendationProcessedOrder', t => {
    t.uuid('orderId').primary();
    t.uuid('organizationId').notNullable();
    t.uuid('storeId').nullable();
    t.specificType('productIds', 'uuid[]').notNullable();
    t.string('status', 20).notNullable().defaultTo('counted'); // counted | reversed | skipped
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'status'], 'idx_recoProcessedOrder_org_status');
  });

  await knex.schema.createTable('recommendationRule', t => {
    t.uuid('recommendationRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.string('name', 255).notNullable();
    t.string('sourceType', 20).notNullable(); // category | brand | collection | productType | tag
    t.uuid('sourceId').notNullable();
    t.string('targetType', 20).notNullable(); // category | brand | collection | tag
    t.uuid('targetId').notNullable();
    t.string('relationType', 20).notNullable().defaultTo('related'); // related | accessory | cross_sell | up_sell
    t.string('targetSort', 20).notNullable().defaultTo('bestSelling'); // bestSelling | newest | rating
    t.string('priceBand', 10).notNullable().defaultTo('any'); // any | cheaper | similar | pricier
    t.integer('maxItems').notNullable().defaultTo(4);
    t.integer('priority').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'sourceType', 'sourceId', 'isActive'], 'idx_recoRule_source');
    t.index(['organizationId', 'isActive', 'priority'], 'idx_recoRule_active');
  });

  await knex.schema.createTable('recommendationExclusion', t => {
    t.uuid('recommendationExclusionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable(); // product the recommendation would appear on; same as org sentinel for 'global'
    t.uuid('excludedProductId').notNullable();
    t.string('scope', 10).notNullable().defaultTo('pair'); // pair | global
    t.string('reason', 255);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId', 'excludedProductId', 'scope'], { indexName: 'uq_recoExclusion' });
    t.index(['organizationId', 'productId'], 'idx_recoExclusion_product');
  });

  await knex.schema.createTable('recommendationCandidate', t => {
    t.uuid('recommendationCandidateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.uuid('candidateProductId').notNullable();
    t.string('source', 10).notNullable(); // rule | fbt | similar | coView
    t.string('relationType', 20).notNullable().defaultTo('related');
    t.decimal('score', 12, 4).notNullable().defaultTo(0);
    t.jsonb('reason');
    t.timestamp('computedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId', 'candidateProductId', 'source'], { indexName: 'uq_recoCandidate' });
    t.index(['organizationId', 'productId', 'relationType', 'score'], 'idx_recoCandidate_serve');
    t.index(['organizationId', 'candidateProductId'], 'idx_recoCandidate_reverse');
    t.index(['organizationId', 'productId', 'score'], 'idx_recoCandidate_rank');
  });

  await knex.schema.createTable('recommendationPopular', t => {
    t.uuid('recommendationPopularId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.string('scope', 10).notNullable(); // overall | category
    t.uuid('categoryId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.integer('rank').notNullable();
    t.decimal('score', 12, 4).notNullable().defaultTo(0);
    t.timestamp('computedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'scope', 'categoryId', 'productId'], { indexName: 'uq_recoPopular' });
    t.index(['organizationId', 'scope', 'categoryId', 'rank'], 'idx_recoPopular_serve');
  });
};

exports.down = async function (knex) {
  await knex.schema
    .dropTableIfExists('recommendationPopular')
    .dropTableIfExists('recommendationCandidate')
    .dropTableIfExists('recommendationExclusion')
    .dropTableIfExists('recommendationRule')
    .dropTableIfExists('recommendationProcessedOrder')
    .dropTableIfExists('recommendationTenantStat')
    .dropTableIfExists('recommendationProductStat')
    .dropTableIfExists('recommendationCoView')
    .dropTableIfExists('recommendationCoPurchase');
};
