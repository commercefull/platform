/**
 * Support Test Data Seed
 * Seeds test data for support integration tests
 */

// Fixed UUIDs for test data consistency
const SUPPORT_AGENT_IDS = {
  AGENT_JOHN: '01939000-0000-7000-8000-000000000001',
  AGENT_JANE: '01939000-0000-7000-8000-000000000002',
  SUPERVISOR_BOB: '01939000-0000-7000-8000-000000000003',
};

const SUPPORT_TICKET_IDS = {
  TICKET_OPEN: '01939001-0000-7000-8000-000000000001',
  TICKET_IN_PROGRESS: '01939001-0000-7000-8000-000000000002',
  TICKET_RESOLVED: '01939001-0000-7000-8000-000000000003',
};

const SUPPORT_MESSAGE_IDS = {
  MSG_INITIAL: '01939002-0000-7000-8000-000000000001',
  MSG_REPLY: '01939002-0000-7000-8000-000000000002',
};

const FAQ_CATEGORY_IDS = {
  ORDERS: '01939003-0000-7000-8000-000000000001',
  SHIPPING: '01939003-0000-7000-8000-000000000002',
  RETURNS: '01939003-0000-7000-8000-000000000003',
};

const FAQ_ARTICLE_IDS = {
  HOW_TO_ORDER: '01939004-0000-7000-8000-000000000001',
  SHIPPING_TIMES: '01939004-0000-7000-8000-000000000002',
  RETURN_POLICY: '01939004-0000-7000-8000-000000000003',
};

const STOCK_ALERT_IDS = {
  ALERT_1: '01939005-0000-7000-8000-000000000001',
  ALERT_2: '01939005-0000-7000-8000-000000000002',
};

const PRICE_ALERT_IDS = {
  ALERT_1: '01939006-0000-7000-8000-000000000001',
  ALERT_2: '01939006-0000-7000-8000-000000000002',
};

// Test customer ID (should exist from customer seeds)
const TEST_CUSTOMER_ID = '01910000-0000-7000-8000-000000000001';
// Test product ID (should exist from product seeds)
const TEST_PRODUCT_ID = '01912000-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  // Clean up existing test data in reverse order of dependencies
  await knex('supportAttachment')
    .whereIn('supportTicketId', Object.values(SUPPORT_TICKET_IDS))
    .del()
    .catch(() => {});
  await knex('supportMessage')
    .whereIn('supportMessageId', Object.values(SUPPORT_MESSAGE_IDS))
    .del()
    .catch(() => {});
  await knex('supportTicket')
    .whereIn('supportTicketId', Object.values(SUPPORT_TICKET_IDS))
    .del()
    .catch(() => {});
  await knex('supportAgent')
    .whereIn('supportAgentId', Object.values(SUPPORT_AGENT_IDS))
    .del()
    .catch(() => {});
  await knex('faqArticle')
    .whereIn('faqArticleId', Object.values(FAQ_ARTICLE_IDS))
    .del()
    .catch(() => {});
  await knex('faqCategory')
    .whereIn('faqCategoryId', Object.values(FAQ_CATEGORY_IDS))
    .del()
    .catch(() => {});
  await knex('stockAlert')
    .whereIn('stockAlertId', Object.values(STOCK_ALERT_IDS))
    .del()
    .catch(() => {});
  await knex('priceAlert')
    .whereIn('priceAlertId', Object.values(PRICE_ALERT_IDS))
    .del()
    .catch(() => {});

  // Seed Support Agents
  await knex('supportAgent').insert([
    {
      supportAgentId: SUPPORT_AGENT_IDS.AGENT_JOHN,
      email: 'john.agent@example.com',
      firstName: 'John',
      lastName: 'Agent',
      displayName: 'John A.',
      role: 'agent',
      department: 'Customer Service',
      skills: ['orders', 'shipping', 'returns'],
      languages: ['en', 'es'],
      isActive: true,
      isAvailable: true,
      maxTickets: 20,
      currentTickets: 2,
      totalTicketsHandled: 150,
      averageResponseTimeMinutes: 15,
      averageResolutionTimeMinutes: 120,
      satisfactionScore: 4.5,
      satisfactionCount: 100,
      timezone: 'America/New_York',
    },
    {
      supportAgentId: SUPPORT_AGENT_IDS.AGENT_JANE,
      email: 'jane.agent@example.com',
      firstName: 'Jane',
      lastName: 'Agent',
      displayName: 'Jane A.',
      role: 'agent',
      department: 'Technical Support',
      skills: ['technical', 'account', 'payment'],
      languages: ['en', 'fr'],
      isActive: true,
      isAvailable: false,
      maxTickets: 15,
      currentTickets: 15,
      totalTicketsHandled: 200,
      averageResponseTimeMinutes: 10,
      averageResolutionTimeMinutes: 90,
      satisfactionScore: 4.8,
      satisfactionCount: 180,
      timezone: 'America/Los_Angeles',
    },
    {
      supportAgentId: SUPPORT_AGENT_IDS.SUPERVISOR_BOB,
      email: 'bob.supervisor@example.com',
      firstName: 'Bob',
      lastName: 'Supervisor',
      displayName: 'Bob S.',
      role: 'supervisor',
      department: 'Customer Service',
      skills: ['escalation', 'management'],
      languages: ['en'],
      isActive: true,
      isAvailable: true,
      maxTickets: 10,
      currentTickets: 1,
      totalTicketsHandled: 500,
      averageResponseTimeMinutes: 5,
      averageResolutionTimeMinutes: 60,
      satisfactionScore: 4.9,
      satisfactionCount: 400,
      timezone: 'America/Chicago',
    },
  ]);

  // Check if test customer exists
  const customerExists = await knex('customer').where('customerId', TEST_CUSTOMER_ID).first();
  const customerId = customerExists ? TEST_CUSTOMER_ID : null;

  // Seed Support Tickets
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await knex('supportTicket').insert([
    {
      supportTicketId: SUPPORT_TICKET_IDS.TICKET_OPEN,
      ticketNumber: 'TKT-TEST-001',
      customerId: customerId,
      email: 'customer@example.com',
      name: 'Test Customer',
      subject: 'Question about my order',
      description: 'I have a question about my recent order status.',
      status: 'open',
      priority: 'medium',
      category: 'order',
      channel: 'web',
      createdAt: now,
    },
    {
      supportTicketId: SUPPORT_TICKET_IDS.TICKET_IN_PROGRESS,
      ticketNumber: 'TKT-TEST-002',
      customerId: customerId,
      email: 'customer@example.com',
      name: 'Test Customer',
      subject: 'Shipping delay issue',
      description: 'My package has not arrived yet.',
      status: 'in_progress',
      priority: 'high',
      category: 'shipping',
      channel: 'email',
      assignedAgentId: SUPPORT_AGENT_IDS.AGENT_JOHN,
      firstResponseAt: yesterday,
      responseTimeMinutes: 30,
      createdAt: yesterday,
    },
    {
      supportTicketId: SUPPORT_TICKET_IDS.TICKET_RESOLVED,
      ticketNumber: 'TKT-TEST-003',
      customerId: customerId,
      email: 'customer@example.com',
      name: 'Test Customer',
      subject: 'Return request completed',
      description: 'I wanted to return an item.',
      status: 'resolved',
      priority: 'low',
      category: 'return',
      channel: 'web',
      assignedAgentId: SUPPORT_AGENT_IDS.AGENT_JANE,
      firstResponseAt: lastWeek,
      responseTimeMinutes: 15,
      resolvedAt: yesterday,
      resolutionTimeMinutes: 1440,
      resolutionType: 'resolved',
      resolutionNotes: 'Return processed successfully',
      customerSatisfaction: 5,
      customerFeedback: 'Great service!',
      createdAt: lastWeek,
    },
  ]);

  // Seed Support Messages
  await knex('supportMessage').insert([
    {
      supportMessageId: SUPPORT_MESSAGE_IDS.MSG_INITIAL,
      supportTicketId: SUPPORT_TICKET_IDS.TICKET_IN_PROGRESS,
      senderId: customerId,
      senderType: 'customer',
      senderName: 'Test Customer',
      senderEmail: 'customer@example.com',
      message: 'My package was supposed to arrive yesterday but it has not shown up.',
      messageType: 'reply',
      isInternal: false,
      isRead: true,
      createdAt: yesterday,
    },
    {
      supportMessageId: SUPPORT_MESSAGE_IDS.MSG_REPLY,
      supportTicketId: SUPPORT_TICKET_IDS.TICKET_IN_PROGRESS,
      senderId: SUPPORT_AGENT_IDS.AGENT_JOHN,
      senderType: 'agent',
      senderName: 'John Agent',
      senderEmail: 'john.agent@example.com',
      message: 'I apologize for the delay. Let me check the tracking information for you.',
      messageType: 'reply',
      isInternal: false,
      isRead: true,
      createdAt: now,
    },
  ]);

  // Seed FAQ Categories
  await knex('faqCategory').insert([
    {
      faqCategoryId: FAQ_CATEGORY_IDS.ORDERS,
      name: 'Orders & Payments',
      slug: 'orders-payments',
      description: 'Help with placing orders and payment methods',
      icon: 'shopping-cart',
      sortOrder: 1,
      articleCount: 1,
      isActive: true,
      isFeatured: true,
    },
    {
      faqCategoryId: FAQ_CATEGORY_IDS.SHIPPING,
      name: 'Shipping & Delivery',
      slug: 'shipping-delivery',
      description: 'Information about shipping options and delivery times',
      icon: 'truck',
      sortOrder: 2,
      articleCount: 1,
      isActive: true,
      isFeatured: true,
    },
    {
      faqCategoryId: FAQ_CATEGORY_IDS.RETURNS,
      name: 'Returns & Refunds',
      slug: 'returns-refunds',
      description: 'Our return policy and refund process',
      icon: 'refresh',
      sortOrder: 3,
      articleCount: 1,
      isActive: true,
      isFeatured: false,
    },
  ]);

  // Seed FAQ Articles
  await knex('faqArticle').insert([
    {
      faqArticleId: FAQ_ARTICLE_IDS.HOW_TO_ORDER,
      faqCategoryId: FAQ_CATEGORY_IDS.ORDERS,
      title: 'How to Place an Order',
      slug: 'how-to-place-order',
      content: 'To place an order, simply browse our products, add items to your cart, and proceed to checkout.',
      contentHtml: '<p>To place an order, simply browse our products, add items to your cart, and proceed to checkout.</p>',
      excerpt: 'Learn how to place an order on our website.',
      keywords: ['order', 'checkout', 'buy'],
      views: 500,
      uniqueViews: 350,
      helpfulYes: 45,
      helpfulNo: 5,
      helpfulScore: 0.9,
      sortOrder: 1,
      isPublished: true,
      isFeatured: true,
      isPinned: false,
      publishedAt: lastWeek,
    },
    {
      faqArticleId: FAQ_ARTICLE_IDS.SHIPPING_TIMES,
      faqCategoryId: FAQ_CATEGORY_IDS.SHIPPING,
      title: 'Shipping Times and Options',
      slug: 'shipping-times-options',
      content: 'We offer standard (5-7 days), express (2-3 days), and overnight shipping options.',
      contentHtml: '<p>We offer standard (5-7 days), express (2-3 days), and overnight shipping options.</p>',
      excerpt: 'Learn about our shipping options and delivery times.',
      keywords: ['shipping', 'delivery', 'express'],
      views: 800,
      uniqueViews: 600,
      helpfulYes: 70,
      helpfulNo: 10,
      helpfulScore: 0.875,
      sortOrder: 1,
      isPublished: true,
      isFeatured: true,
      isPinned: true,
      publishedAt: lastWeek,
    },
    {
      faqArticleId: FAQ_ARTICLE_IDS.RETURN_POLICY,
      faqCategoryId: FAQ_CATEGORY_IDS.RETURNS,
      title: 'Return Policy',
      slug: 'return-policy',
      content: 'You can return most items within 30 days of purchase for a full refund.',
      contentHtml: '<p>You can return most items within 30 days of purchase for a full refund.</p>',
      excerpt: 'Learn about our 30-day return policy.',
      keywords: ['return', 'refund', 'policy'],
      views: 1200,
      uniqueViews: 900,
      helpfulYes: 100,
      helpfulNo: 15,
      helpfulScore: 0.87,
      sortOrder: 1,
      isPublished: true,
      isFeatured: false,
      isPinned: false,
      publishedAt: lastWeek,
    },
  ]);

  // Check if test product exists before seeding alerts
  const productExists = await knex('product').where('productId', TEST_PRODUCT_ID).first();

  if (productExists) {
    // Seed Stock Alerts
    await knex('stockAlert').insert([
      {
        stockAlertId: STOCK_ALERT_IDS.ALERT_1,
        customerId: customerId,
        email: 'customer@example.com',
        productId: TEST_PRODUCT_ID,
        productName: 'Test Product',
        status: 'active',
        desiredQuantity: 1,
        stockThreshold: 1,
        notifyOnAnyStock: true,
        notificationChannel: 'email',
        notificationCount: 0,
      },
      {
        stockAlertId: STOCK_ALERT_IDS.ALERT_2,
        email: 'guest@example.com',
        productId: TEST_PRODUCT_ID,
        productName: 'Test Product',
        status: 'active',
        desiredQuantity: 5,
        stockThreshold: 5,
        notifyOnAnyStock: false,
        notificationChannel: 'email',
        notificationCount: 0,
      },
    ]);

    // Seed Price Alerts
    await knex('priceAlert').insert([
      {
        priceAlertId: PRICE_ALERT_IDS.ALERT_1,
        customerId: customerId,
        email: 'customer@example.com',
        productId: TEST_PRODUCT_ID,
        productName: 'Test Product',
        status: 'active',
        alertType: 'target',
        targetPrice: 50.0,
        originalPrice: 100.0,
        notificationChannel: 'email',
        notificationCount: 0,
      },
      {
        priceAlertId: PRICE_ALERT_IDS.ALERT_2,
        email: 'guest@example.com',
        productId: TEST_PRODUCT_ID,
        productName: 'Test Product',
        status: 'active',
        alertType: 'percentage_drop',
        percentageThreshold: 20,
        originalPrice: 100.0,
        notificationChannel: 'email',
        notificationCount: 0,
      },
    ]);

    console.log('Support test data seeded successfully (with alerts)');
  } else {
    console.log('Support test data seeded (without alerts - product not found)');
  }
};
