import {
  createShippingZonePort,
  createShippingZone,
} from '../../tests/testUtils';
import { ManageShippingZonesUseCase } from './ManageShippingZones';

describe('ManageShippingZonesUseCase', () => {
  let useCase: ManageShippingZonesUseCase;
  let zoneRepo: ReturnType<typeof createShippingZonePort>;

  beforeEach(() => {
    zoneRepo = createShippingZonePort();
    useCase = new ManageShippingZonesUseCase(zoneRepo);
  });

  it('should find a zone by ID', async () => {
    zoneRepo.findById.mockResolvedValue(createShippingZone({ shippingZoneId: 'z1' }));

    const result = await useCase.findById('z1');

    expect(result?.shippingZoneId).toBe('z1');
    expect(zoneRepo.findById).toHaveBeenCalledWith('z1');
  });

  it('should list all zones', async () => {
    zoneRepo.findAll.mockResolvedValue([createShippingZone()]);

    const result = await useCase.findAll();

    expect(result).toHaveLength(1);
  });

  it('should create a zone', async () => {
    zoneRepo.create.mockImplementation(async input => createShippingZone({ ...input, shippingZoneId: 'z2' }));
    const { shippingZoneId: _z, createdAt: _c, updatedAt: _u, ...input } = createShippingZone({ name: 'EU', locations: ['DE'] });

    const result = await useCase.create(input);

    expect(result.shippingZoneId).toBe('z2');
    expect(zoneRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'EU' }));
  });

  it('should activate a zone', async () => {
    zoneRepo.activate.mockResolvedValue(createShippingZone({ isActive: true }));

    const result = await useCase.activate('z1');

    expect(result?.isActive).toBe(true);
  });

  it('should delete a zone', async () => {
    zoneRepo.delete.mockResolvedValue(true);

    const result = await useCase.delete('z1');

    expect(result).toBe(true);
    expect(zoneRepo.delete).toHaveBeenCalledWith('z1');
  });
});

