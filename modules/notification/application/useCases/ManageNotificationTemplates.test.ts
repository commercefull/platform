jest.mock('../../infrastructure/repositories/NotificationConfigRepository', () => ({
  __esModule: true,
  default: {
    templates: {
      findAll: jest.fn().mockResolvedValue([{ templateId: 't1' }]),
      findByCategory: jest.fn().mockResolvedValue([{ templateId: 't1' }]),
      findById: jest.fn().mockResolvedValue({ templateId: 't1' }),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue({ templateId: 't2' }),
      update: jest.fn().mockResolvedValue(undefined),
      activate: jest.fn().mockResolvedValue(undefined),
      deactivate: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      clone: jest.fn().mockResolvedValue({ templateId: 't3' }),
      getPreview: jest.fn().mockResolvedValue({ subject: 'Test', body: 'Hello' }),
    },
    preferences: {},
    devices: {},
    templateTranslations: {},
  },
}));

import { ManageNotificationTemplatesUseCase } from './ManageNotificationTemplates';
import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';

const mockRepo = notificationConfigRepository as unknown as { templates: Record<string, jest.Mock> };

describe('ManageNotificationTemplatesUseCase', () => {
  let useCase: ManageNotificationTemplatesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageNotificationTemplatesUseCase();
  });

  it('should find all templates', async () => {
    const result = await useCase.findAll(true);
    expect(result).toHaveLength(1);
    expect(mockRepo.templates.findAll).toHaveBeenCalledWith(true);
  });

  it('should find by category', async () => {
    const result = await useCase.findByCategory('order');
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('t1');
    expect(result).toEqual({ templateId: 't1' });
  });

  it('should create template', async () => {
    const result = await useCase.create({ code: 'welcome', name: 'Welcome' } as never);
    expect(result).toEqual({ templateId: 't2' });
  });

  it('should activate template', async () => {
    await useCase.activate('t1');
    expect(mockRepo.templates.activate).toHaveBeenCalledWith('t1');
  });

  it('should clone template', async () => {
    const result = await useCase.clone('t1', 'new_code', 'New Name');
    expect(result).toEqual({ templateId: 't3' });
  });

  it('should get preview', async () => {
    const result = await useCase.getPreview('t1', { name: 'John' });
    expect(result).toBeDefined();
  });
});
