import { lazyMock, createContentTemplate, emitMock } from '../../../tests/testUtils';
import { DuplicateTemplateUseCase, DuplicateTemplateCommand } from './DuplicateTemplate';
import { ContentTemplateNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('DuplicateTemplateUseCase', () => {
  let useCase: DuplicateTemplateUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DuplicateTemplateUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DuplicateTemplateUseCase>[0]>();
    mockRepo.findTemplateById.mockResolvedValue(
      createContentTemplate({ contentTemplateId: 't1', name: 'Original', slug: 'original', description: 'Original template', htmlStructure: '<div></div>' }),
    );
    mockRepo.createTemplate.mockResolvedValue(createContentTemplate({ contentTemplateId: 't2', name: 'Copy', slug: 'copy' }));
    useCase = new DuplicateTemplateUseCase(mockRepo);
  });

  it('should duplicate a template successfully', async () => {
    const result = await useCase.execute(new DuplicateTemplateCommand('t1', 'Copy', 'copy'));

    expect(result.contentTemplateId).toBe('t2');
    expect(result.originalTemplateId).toBe('t1');
    expect(emitMock).toHaveBeenCalled();
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(useCase.execute(new DuplicateTemplateCommand('', 'Copy', 'copy'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentTemplateNotFoundError when original does not exist', async () => {
    mockRepo.findTemplateById.mockResolvedValue(null);

    await expect(useCase.execute(new DuplicateTemplateCommand('missing', 'Copy', 'copy'))).rejects.toThrow(ContentTemplateNotFoundError);
  });
});
