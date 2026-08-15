/**
 * Get Pickup Slots Use Case
 *
 * Generates available pickup time slots based on a pickup location's
 * operating hours, maxOrdersPerSlot, and prepareTimeMinutes.
 */

export interface PickupSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: number;
  maxOrders: number;
}

export interface PickupLocationConfig {
  maxOrdersPerSlot: number;
  prepareTimeMinutes: number;
  operatingHours: Record<string, { open: string; close: string }>;
}

export class GetPickupSlotsUseCase {
  /**
   * Generate available pickup slots for the next N days
   */
  execute(config: PickupLocationConfig, daysAhead: number = 7): PickupSlot[] {
    const slots: PickupSlot[] = [];
    const now = new Date();
    const slotDurationMinutes = 60; // 1-hour slots
    const minPrepareTime = config.prepareTimeMinutes || 60;

    // Earliest pickup time from now
    const earliestStart = new Date(now.getTime() + minPrepareTime * 60 * 1000);

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      const hours = config.operatingHours[dayName];
      if (!hours) continue;

      const [openHour, openMinute] = hours.open.split(':').map(Number);
      const [closeHour, closeMinute] = hours.close.split(':').map(Number);

      const dayStart = new Date(date);
      dayStart.setHours(openHour, openMinute, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(closeHour, closeMinute, 0, 0);

      // If this is today, skip past times that are before earliest start
      const effectiveStart = day === 0 && dayStart < earliestStart ? earliestStart : dayStart;

      // Generate 1-hour slots
      let slotStart = new Date(effectiveStart);
      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000);
        if (slotEnd > dayEnd) break;

        slots.push({
          date: date.toISOString().split('T')[0],
          startTime: slotStart.toTimeString().split(' ')[0],
          endTime: slotEnd.toTimeString().split(' ')[0],
          available: config.maxOrdersPerSlot || 10,
          maxOrders: config.maxOrdersPerSlot || 10,
        });

        slotStart = slotEnd;
      }
    }

    return slots;
  }
}

export const getPickupSlotsUseCase = new GetPickupSlotsUseCase();
