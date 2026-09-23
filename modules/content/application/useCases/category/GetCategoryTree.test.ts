import { GetCategoryTreeUseCase, GetCategoryTreeQuery } from './GetCategoryTree';
import { lazyMock, createContentCategory } from '../../../tests/testUtils';

describe('GetCategoryTreeUseCase', () => {
  let useCase: GetCategoryTreeUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetCategoryTreeUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof GetCategoryTreeUseCase>[0]>();
    mockRepo.getCategoryTree.mockResolvedValue([]);
    useCase = new GetCategoryTreeUseCase(mockRepo);
  });

  it('should build a tree from flat categories', async () => {
    mockRepo.getCategoryTree.mockResolvedValue([
      createContentCategory({ contentCategoryId: 'c1', name: 'Root', slug: 'root' }),
      createContentCategory({ contentCategoryId: 'c2', name: 'Child', slug: 'child', parentId: 'c1', depth: 1 }),
    ]);

    const tree = await useCase.execute(new GetCategoryTreeQuery());

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Root');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Child');
  });

  it('should return empty tree when no categories', async () => {
    const tree = await useCase.execute(new GetCategoryTreeQuery());

    expect(tree).toEqual([]);
  });
});
