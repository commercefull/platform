import axios, { AxiosInstance } from 'axios';

// Test data
export const testContentType = {
  name: 'Test Content Type',
  slug: `test-content-type-${Math.floor(Math.random() * 1000)}`,
  description: 'Content type for integration tests',
  schema: {
    title: { type: 'string', required: true },
    body: { type: 'richtext', required: true },
    image: { type: 'image', required: false }
  },
  status: 'active' as const
};

export const testContentPage = {
  title: 'Test Content Page',
  slug: `test-page-${Math.floor(Math.random() * 1000)}`,
  status: 'published' as const,
  visibility: 'public' as const,
  summary: 'This is a test page created for integration testing',
  metaTitle: 'Test Page | Integration Tests',
  metaDescription: 'Test page for content feature integration tests',
  isHomePage: false,
  contentTypeId: '' // Will be set during setup
};

export const testContentBlock = {
  name: 'Test Content Block',
  order: 1,
  content: {
    title: 'Test Block Title',
    body: '<p>This is a test content block for integration testing.</p>',
    image: 'https://example.com/placeholder.jpg'
  },
  status: 'active' as const,
  pageId: '', // Will be set during setup
  contentTypeId: '' // Will be set during setup
};

export const testContentTemplate = {
  name: 'Test Template',
  type: 'layout' as const,
  description: 'Test template for integration tests',
  structure: {
    sections: [
      { name: 'header', label: 'Header' },
      { name: 'main', label: 'Main Content' },
      { name: 'footer', label: 'Footer' }
    ]
  },
  status: 'active' as const
};

// Test credentials
const adminCredentials = {
  email: 'admin@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for content integration tests
 */
export async function setupContentTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true // Don't throw HTTP errors
  });

  // Get admin token
  const loginResponse = await client.post('/api/auth/login', adminCredentials);
  const adminToken = loginResponse.data.token;

  if (!loginResponse.data.success || !adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create test data
  // 1. Create Content Type
  const contentTypeResponse = await client.post('/api/admin/content/types', testContentType, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!contentTypeResponse.data.success) {
    throw new Error('Failed to create test content type');
  }
  
  const testContentTypeId = contentTypeResponse.data.data.id;
  
  // 2. Create Content Page with the created content type ID
  const pageData = {
    ...testContentPage,
    contentTypeId: testContentTypeId
  };
  
  const pageResponse = await client.post('/api/admin/content/pages', pageData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!pageResponse.data.success) {
    throw new Error('Failed to create test content page');
  }
  
  const testContentPageId = pageResponse.data.data.id;

  // 3. Create Content Block
  const blockData = {
    ...testContentBlock,
    pageId: testContentPageId,
    contentTypeId: testContentTypeId
  };
  
  const blockResponse = await client.post('/api/admin/content/blocks', blockData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!blockResponse.data.success) {
    throw new Error('Failed to create test content block');
  }
  
  const testContentBlockId = blockResponse.data.data.id;

  // 4. Create Content Template
  const templateResponse = await client.post('/api/admin/content/templates', testContentTemplate, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!templateResponse.data.success) {
    throw new Error('Failed to create test content template');
  }
  
  const testContentTemplateId = templateResponse.data.data.id;

  return {
    client,
    adminToken,
    testContentTypeId,
    testContentPageId,
    testContentBlockId,
    testContentTemplateId,
    testContentTypeSlug: testContentType.slug,
    testContentPageSlug: testContentPage.slug
  };
}

/**
 * Cleanup function for content integration tests
 */
export async function cleanupContentTests(
  client: AxiosInstance, 
  adminToken: string, 
  { 
    testContentBlockId,
    testContentPageId,
    testContentTypeId,
    testContentTemplateId
  }: {
    testContentBlockId: string,
    testContentPageId: string,
    testContentTypeId: string,
    testContentTemplateId: string
  }
) {
  try {
    // Clean up in reverse order of creation
    // 1. Delete Content Block
    if (testContentBlockId) {
      await client.delete(`/api/admin/content/blocks/${testContentBlockId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    
    // 2. Delete Content Page
    if (testContentPageId) {
      await client.delete(`/api/admin/content/pages/${testContentPageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    
    // 3. Delete Content Template
    if (testContentTemplateId) {
      await client.delete(`/api/admin/content/templates/${testContentTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    
    // 4. Delete Content Type - do this last since other entities depend on it
    if (testContentTypeId) {
      await client.delete(`/api/admin/content/types/${testContentTypeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
