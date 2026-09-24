import {
  createShippingZonePort,
  createShippingZone,
} from '../../tests/testUtils';
import { ManageShippingZonesLookupUseCase } from './ManageShippingZonesLookup';

describe('ManageShippingZonesLookupUseCase', () => {
  let useCase: ManageShippingZonesLookupUseCase;
  let zoneRepo: ReturnType<typeof createShippingZonePort>;

  beforeEach(() => {
    zoneRepo = createShippingZonePort();
    useCase = new ManageShippingZonesLookupUseCase(zoneRepo);
  });

  it('should list all zones', async () => {
    zoneRepo.findAll.mockResolvedValue([createShippingZone()]);

    const result = await useCase.findAll();

    expect(result).toHaveLength(1);
  });

  it('should find a zone by ID', async () => {
    zoneRepo.findById.mockResolvedValue(createShippingZone({ shippingZoneId: 'z1' }));

    const result = await useCase.findById('z1');

    expect(result?.shippingZoneId).toBe('z1');
    expect(zoneRepo.findById).toHaveBeenCalledWith('z1');
  });

  it('should return null when the zone does not exist', async () => {
    zoneRepo.findById.mockResolvedValue(null);

    const result = await useCase.findById('missing');

    expect(result).toBeNull();
  });
});
