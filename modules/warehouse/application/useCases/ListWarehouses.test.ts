import { ListWarehousesUseCase} from './ListWarehouses';

describe('ListWarehousesUseCase', () => {
  let useCase: ListWarehousesUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue([
        { distributionWarehouseId: 'wh-1', name: 'Main', code: 'WH001', description: 'fulfillment', city: 'Portland', country: 'US', isActive: true, isDefault: true },
        { distributionWarehouseId: 'wh-2', name: 'East', code: 'EAST', description: 'return', city: 'NYC', country: 'US', isActive: false, isDefault: false, organizationId: 'org-1' },
      ]),
    };
    useCase = new ListWarehousesUseCase(mockRepo as never);
  });

  it('should list warehouses with default pagination', async () => {
    const result = await useCase.execute({});

    expect(result.warehouses).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should filter by type', async () => {
    const result = await useCase.execute({ filters: { type: 'fulfillment' } });

    expect(result.warehouses).toHaveLength(1);
    expect(result.warehouses[0].name).toBe('Main');
  });

  it('should filter by organizationId', async () => {
    const result = await useCase.execute({ filters: { organizationId: 'org-1' } });

    expect(result.warehouses).toHaveLength(1);
    expect(result.warehouses[0].code).toBe('EAST');
  });

  it('should paginate correctly', async () => {
    const result = await useCase.execute({ pagination: { page: 2, limit: 1 } });

    expect(result.warehouses).toHaveLength(1);
    expect(result.warehouses[0].code).toBe('EAST');
    expect(result.totalPages).toBe(2);
  });
});
