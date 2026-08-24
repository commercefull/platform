import { OrganizeMediaFolderUseCase, CreateFolderCommand, MoveFolderCommand } from './OrganizeMediaFolder';
import { MediaFolderNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('OrganizeMediaFolderUseCase', () => {
  let useCase: OrganizeMediaFolderUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findFolderById: jest.fn().mockResolvedValue({ folderId: 'f1', name: 'Parent', path: 'Parent', depth: 0 }),
      createFolder: jest.fn().mockImplementation(async (input: { name: string; parentId: string | null; path: string; depth: number }) => ({
        contentMediaFolderId: 'f2', name: input.name, path: input.path, depth: input.depth, createdAt: new Date(),
      })),
      updateFolder: jest.fn().mockResolvedValue({ contentMediaFolderId: 'f2', name: 'Child', path: 'NewParent/Child', depth: 1, createdAt: new Date() }),
      moveMediaToFolder: jest.fn().mockResolvedValue(undefined),
      getFolderTree: jest.fn().mockResolvedValue([]),
      deleteFolder: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new OrganizeMediaFolderUseCase(mockRepo as never);
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
