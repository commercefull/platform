jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateTemplateUseCase, CreateTemplateCommand } from './CreateTemplate';
import { ContentTypeNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreateTemplateUseCase', () => {
  let useCase: CreateTemplateUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findContentTypeById: jest.fn().mockResolvedValue({ contentTypeId: 'ct-1', name: 'Blog', slug: 'blog' }),
      createTemplate: jest.fn().mockResolvedValue({
        contentTemplateId: 't1', name: 'Blog Template', slug: 'blog-template',
        description: 'A blog template', thumbnail: null, isSystem: false, isActive: true, createdAt: new Date(),
      }),
    };
    useCase = new CreateTemplateUseCase(mockRepo as never);
  });

  it('should create a template successfully', async () => {
    const result = await useCase.execute(new CreateTemplateCommand('Blog Template', 'blog-template', 'A blog template'));

    expect(result.contentTemplateId).toBe('t1');
    expect(eventBus.emit).toHaveBeenCalledWith('content.template.created', expect.objectContaining({ templateId: 't1' }));
  });

  it('should throw ContentValidationError when name or slug missing', async () => {
    await expect(useCase.execute(new CreateTemplateCommand('', 'slug'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateTemplateCommand('Name', ''))).rejects.toThrow(ContentValidationError);
  });

  it('should validate compatible content types', async () => {
    mockRepo.findContentTypeById.mockResolvedValue(null);

    await expect(useCase.execute(new CreateTemplateCommand('Name', 'slug', undefined, undefined, undefined, undefined, undefined, undefined, undefined, ['missing-ct']))).rejects.toThrow(ContentTypeNotFoundError);
  });
});
