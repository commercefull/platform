







export function createTestTicket(overrides: Partial<unknown> = {}) {
  const timestamp = Date.now();
  return {
    subject: `Test Ticket ${timestamp}`,
    description: 'This is a test support ticket for integration testing.',
    email: 'test@example.com',
    name: 'Test User',
    category: 'other',
    priority: 'medium',
    channel: 'web',
    ...overrides,
  };
}

export function createTestAgent(overrides: Partial<unknown> = {}) {
  const timestamp = Date.now();
  return {
    email: `agent-${timestamp}@example.com`,
    firstName: 'Test',
    lastName: 'Agent',
    displayName: 'Test A.',
    role: 'agent',
    department: 'Customer Service',
    isActive: true,
    isAvailable: true,
    maxTickets: 20,
    timezone: 'UTC',
    ...overrides,
  };
}

export function createTestFaqCategory(overrides: Partial<unknown> = {}) {
  return {
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    description: 'Integration test FAQ category',
    sortOrder: 1,
    ...overrides,
  };
}

export function createTestFaqArticle(categoryId: string, overrides: Partial<unknown> = {}) {
  return {
    title: `Test Article ${Date.now()}`,
    slug: `test-article-${Date.now()}`,
    content: 'This is test FAQ content for integration testing.',
    categoryId,
    tags: ['test', 'integration'],
    ...overrides,
  };
}
