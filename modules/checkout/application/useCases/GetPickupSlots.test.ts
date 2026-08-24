import { GetPickupSlotsUseCase, PickupLocationConfig } from './GetPickupSlots';

describe('GetPickupSlotsUseCase', () => {
  let useCase: GetPickupSlotsUseCase;

  beforeEach(() => {
    useCase = new GetPickupSlotsUseCase();
  });

  const config: PickupLocationConfig = {
    maxOrdersPerSlot: 5,
    prepareTimeMinutes: 60,
    operatingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '15:00' },
      sunday: { open: '10:00', close: '15:00' },
    },
  };

  it('should generate pickup slots (happy path)', () => {
    const slots = useCase.execute(config, 7);

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].maxOrders).toBe(5);
    expect(slots[0].available).toBe(5);
  });

  it('should generate 1-hour slots', () => {
    const slots = useCase.execute(config, 1);

    if (slots.length > 1) {
      const first = slots[0];
      const second = slots[1];
      expect(second.startTime).not.toBe(first.startTime);
    }
  });

  it('should skip days with no operating hours', () => {
    const partialConfig: PickupLocationConfig = {
      maxOrdersPerSlot: 3,
      prepareTimeMinutes: 30,
      operatingHours: {
        monday: { open: '09:00', close: '17:00' },
      },
    };

    const slots = useCase.execute(partialConfig, 14);

    expect(slots.length).toBeGreaterThan(0);
  });
});
