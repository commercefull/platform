import { lazyMock, createContentType, createContentTemplate, emitMock } from '../../../tests/testUtils';
import { CreateTemplateUseCase, CreateTemplateCommand } from './CreateTemplate';
import { ContentTypeNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('CreateTemplateUseCase', () => {
  let useCase: CreateTemplateUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateTemplateUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof CreateTemplateUseCase>[0]>();
    mockRepo.findContentTypeById.mockResolvedValue(createContentType({ contentTypeId: 'ct-1', name: 'Blog', slug: 'blog' }));
    mockRepo.createTemplate.mockResolvedValue(createContentTemplate({ contentTemplateId: 't1', name: 'Blog Template', slug: 'blog-template', description: 'A blog template' }));
    useCase = new CreateTemplateUseCase(mockRepo);
  });

  it('should create a template successfully', async () => {
    const result = await useCase.execute(new CreateTemplateCommand('Blog Template', 'blog-template', 'A blog template'));

    expect(result.contentTemplateId).toBe('t1');
    expect(emitMock).toHaveBeenCalledWith('content.template.created', expect.objectContaining({ templateId: 't1' }));
  });

  it('should throw ContentValidationError when name or slug missing', async () => {
    await expect(useCase.execute(new CreateTemplateCommand('', 'slug'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateTemplateCommand('Name', ''))).rejects.toThrow(ContentValidationError);
  });

  it('should validate compatible content types', async () => {
    mockRepo.findContentTypeById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new CreateTemplateCommand('Name', 'slug', undefined, undefined, undefined, undefined, undefined, undefined, undefined, [
          'missing-ct',
        ]),
      ),
    ).rejects.toThrow(ContentTypeNotFoundError);
  });
});
