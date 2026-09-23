import { OrganizeMediaFolderUseCase, CreateFolderCommand, MoveFolderCommand } from './OrganizeMediaFolder';
import { MediaFolderNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { lazyMock, createContentMediaFolder } from '../../../tests/testUtils';

describe('OrganizeMediaFolderUseCase', () => {
  let useCase: OrganizeMediaFolderUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof OrganizeMediaFolderUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof OrganizeMediaFolderUseCase>[0]>();
    mockRepo.findFolderById.mockResolvedValue(createContentMediaFolder({ contentMediaFolderId: 'f1', name: 'Parent', path: 'Parent' }));
    mockRepo.createFolder.mockImplementation(async (input) => createContentMediaFolder({ ...input, contentMediaFolderId: 'f2' }));
    mockRepo.updateFolder.mockResolvedValue(createContentMediaFolder({ contentMediaFolderId: 'f2', name: 'Child', path: 'NewParent/Child', depth: 1 }));
    mockRepo.findAllFolders.mockResolvedValue([]);
    mockRepo.deleteFolder.mockResolvedValue(true);
    useCase = new OrganizeMediaFolderUseCase(mockRepo);
  });

  it('should create folder (happy path)', async () => {
    const result = await useCase.createFolder(new CreateFolderCommand('Child', 'f1'));

    expect(result.id).toBe('f2');
    expect(result.name).toBe('Child');
    expect(result.depth).toBe(1);
  });

  it('should create root folder when no parent', async () => {
    const result = await useCase.createFolder(new CreateFolderCommand('Root'));

    expect(result.depth).toBe(0);
  });

  it('should throw ContentValidationError when name is empty', async () => {
    await expect(useCase.createFolder(new CreateFolderCommand(''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw MediaFolderNotFoundError when parent not found', async () => {
    mockRepo.findFolderById.mockResolvedValue(null);

    await expect(useCase.createFolder(new CreateFolderCommand('Child', 'missing'))).rejects.toThrow(MediaFolderNotFoundError);
  });

  it('should move folder (happy path)', async () => {
    await useCase.moveFolder(new MoveFolderCommand('f2', 'f1'));

    expect(mockRepo.updateFolder).toHaveBeenCalledWith('f2', expect.objectContaining({ parentId: 'f1' }));
  });
});
