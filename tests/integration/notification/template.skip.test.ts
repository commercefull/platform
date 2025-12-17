import { AxiosInstance } from 'axios';
import { setupNotificationTests, cleanupNotificationTests, testTemplateData } from './testUtils';

/**
 * Interface for NotificationTemplate objects to ensure type safety in tests
 */
interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  supportedChannels: string[];
  defaultChannel: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  pushTemplate?: string;
  smsTemplate?: string;
  parameters?: Record<string, any>;
  isActive: boolean;
  categoryCode?: string;
  previewData?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  [key: string]: any;
}

describe.skip('Notification Template Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testUserId: string;
  let testNotificationId: string;
  let testTemplateId: string;
  let testPreferenceId: string;

  beforeAll(async () => {
    const setup = await setupNotificationTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
    testUserId = setup.testUserId;
    testNotificationId = setup.testNotificationId;
    testTemplateId = setup.testTemplateId;
    testPreferenceId = setup.testPreferenceId;
  });

  afterAll(async () => {
    await cleanupNotificationTests(
      client,
      adminToken,
      testNotificationId,
      testTemplateId,
      testPreferenceId
    );
  });

  describe('Admin Template Operations', () => {
    it('should get all templates (admin)', async () => {
      const response = await client.get('/business/notification-templates', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify camelCase in response data (TypeScript interface)
      const templates = response.data.data as NotificationTemplate[];
      expect(templates[0]).toHaveProperty('supportedChannels');
      expect(templates[0]).toHaveProperty('defaultChannel');
      expect(templates[0]).toHaveProperty('isActive');
      expect(templates[0]).toHaveProperty('createdAt');
      
      // Verify no snake_case properties are exposed in the API
      expect(templates[0]).not.toHaveProperty('supported_channels');
      expect(templates[0]).not.toHaveProperty('default_channel');
      expect(templates[0]).not.toHaveProperty('is_active');
      expect(templates[0]).not.toHaveProperty('created_at');
    });

    it('should get a template by ID (admin)', async () => {
      const response = await client.get(`/business/notification-templates/${testTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testTemplateId);
      
      // Check template properties match our test data
      const template = response.data.data as NotificationTemplate;
      expect(template.code).toBe(testTemplateData.code);
      expect(template.name).toBe(testTemplateData.name);
      expect(template.type).toBe(testTemplateData.type);
      expect(template.defaultChannel).toBe(testTemplateData.defaultChannel);
      expect(template.htmlTemplate).toBe(testTemplateData.htmlTemplate);
      expect(template.textTemplate).toBe(testTemplateData.textTemplate);
      
      // Verify complex objects
      expect(template.supportedChannels).toEqual(expect.arrayContaining(testTemplateData.supportedChannels));
      expect(template.parameters).toEqual(testTemplateData.parameters);
    });

    it('should create a new template (admin)', async () => {
      const newTemplateData = {
        code: `test-template-new-${Date.now()}`,
        name: 'New Test Template',
        description: 'New template created during integration tests',
        type: 'password_reset',
        supportedChannels: ['email'],
        defaultChannel: 'email',
        subject: 'Password Reset',
        htmlTemplate: '<h1>Reset your password</h1><p>Click <a href="{{resetLink}}">here</a> to reset your password.</p>',
        textTemplate: 'Reset your password: {{resetLink}}',
        parameters: {
          resetLink: 'string'
        },
        isActive: true,
        categoryCode: 'account'
      };
      
      const response = await client.post('/business/notification-templates', newTemplateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      
      // Verify properties
      const createdTemplate = response.data.data as NotificationTemplate;
      expect(createdTemplate.code).toBe(newTemplateData.code);
      expect(createdTemplate.name).toBe(newTemplateData.name);
      expect(createdTemplate.type).toBe(newTemplateData.type);
      expect(createdTemplate.isActive).toBe(newTemplateData.isActive);
      
      // Clean up
      await client.delete(`/business/notification-templates/${createdTemplate.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update a template (admin)', async () => {
      const updateData = {
        name: 'Updated Test Template',
        description: 'This template has been updated',
        isActive: false
      };
      
      const response = await client.put(`/business/notification-templates/${testTemplateId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify updates
      const updatedTemplate = response.data.data as NotificationTemplate;
      expect(updatedTemplate.name).toBe(updateData.name);
      expect(updatedTemplate.description).toBe(updateData.description);
      expect(updatedTemplate.isActive).toBe(updateData.isActive);
      
      // Original data should remain unchanged
      expect(updatedTemplate.code).toBe(testTemplateData.code);
      expect(updatedTemplate.type).toBe(testTemplateData.type);
      expect(updatedTemplate.supportedChannels).toEqual(expect.arrayContaining(testTemplateData.supportedChannels));
    });

    it('should preview a template with sample data (admin)', async () => {
      const previewData = {
        name: 'Preview User',
        testParam: 'Preview Value'
      };
      
      const response = await client.post(`/business/notification-templates/${testTemplateId}/preview`, { 
        data: previewData,
        channel: 'email'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('html');
      expect(response.data.data).toHaveProperty('text');
      
      // Verify template rendering
      expect(response.data.data.html).toContain('Preview User');
      expect(response.data.data.text).toContain('Preview User');
    });

    it('should delete a template (admin)', async () => {
      // Create a template to delete
      const deleteTemplateData = {
        code: `template-to-delete-${Date.now()}`,
        name: 'Delete Test Template',
        type: 'system',
        supportedChannels: ['email'],
        defaultChannel: 'email',
        isActive: true
      };
      
      const createResponse = await client.post('/business/notification-templates', deleteTemplateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const deleteId = createResponse.data.data.id;
      
      // Delete the template
      const response = await client.delete(`/business/notification-templates/${deleteId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify deletion
      const getResponse = await client.get(`/business/notification-templates/${deleteId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(getResponse.status).toBe(404);
      expect(getResponse.data.success).toBe(false);
    });
  });

  describe('Template Access Control', () => {
    it('should prevent customers from accessing admin template operations', async () => {
      // Try to get all templates as customer
      const response = await client.get('/business/notification-templates', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      // Expect 401 (token fails merchant verification) or 403 (authorization denied)
      expect([401, 403]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });
  });

  describe('Template by Type', () => {
    it('should get templates filtered by type', async () => {
      // Get templates by type
      const response = await client.get(`/business/notification-templates/type/${testTemplateData.type}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All templates should be of the specified type
      const templates = response.data.data as NotificationTemplate[];
      expect(templates.every(t => t.type === testTemplateData.type)).toBe(true);
      
      // Should include our test template
      const testTemplate = templates.find(t => t.id === testTemplateId);
      expect(testTemplate).toBeDefined();
    });
  });
});
