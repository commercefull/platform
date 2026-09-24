import { emitMock, lazyMock } from '../../tests/testUtils';
import { CreateShippingZoneUseCase } from './CreateShippingZone';

type ShippingZoneRepository = ConstructorParameters<typeof CreateShippingZoneUseCase>[0];

describe('CreateShippingZoneUseCase', () => {
  let useCase: CreateShippingZoneUseCase;
  let repo: jest.Mocked<ShippingZoneRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<ShippingZoneRepository>();
    repo.saveZone.mockImplementation(async zone => zone);
    useCase = new CreateShippingZoneUseCase(repo);
  });

  it('should create and persist a shipping zone', async () => {
    const result = await useCase.execute({
      name: 'US Zone',
      locations: [{ countryCode: 'US' }],
      isDefault: true,
    });

    expect(result.shippingZone.name).toBe('US Zone');
    expect(result.shippingZone.isDefault).toBe(true);
    expect(repo.saveZone).toHaveBeenCalledWith(result.shippingZone);
    expect(emitMock).toHaveBeenCalledWith('shipping.zone_created', expect.objectContaining({ name: 'US Zone' }));
  });

  it('should default isActive to true', async () => {
    const result = await useCase.execute({
      name: 'EU Zone',
      locations: [{ countryCode: 'DE' }],
    });

    expect(result.shippingZone.isActive).toBe(true);
  });
});
