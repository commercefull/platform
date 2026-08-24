import { GetCategoryTreeUseCase, GetCategoryTreeQuery } from './GetCategoryTree';

describe('GetCategoryTreeUseCase', () => {
  let useCase: GetCategoryTreeUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = { getCategoryTree: jest.fn().mockResolvedValue([]) };
    useCase = new GetCategoryTreeUseCase(mockRepo as never);
  });

  it('should build a tree from flat categories', async () => {
    mockRepo.getCategoryTree.mockResolvedValue([
      { contentCategoryId: 'c1', name: 'Root', slug: 'root', parentId: null, depth: 0, sortOrder: 0, isActive: true },
      { contentCategoryId: 'c2', name: 'Child', slug: 'child', parentId: 'c1', depth: 1, sortOrder: 0, isActive: true },
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
