import {
  createNotificationDeviceRepository,
  createNotificationDevice,
} from '../../tests/testUtils';
import { ManageNotificationDevicesUseCase } from './ManageNotificationDevices';

describe('ManageNotificationDevicesUseCase', () => {
  let useCase: ManageNotificationDevicesUseCase;
  let deviceRepo: ReturnType<typeof createNotificationDeviceRepository>;

  beforeEach(() => {
    deviceRepo = createNotificationDeviceRepository();
    useCase = new ManageNotificationDevicesUseCase(deviceRepo);
  });

  it('should return the devices registered for the user', async () => {
    deviceRepo.findByUser.mockResolvedValue([createNotificationDevice()]);

    const result = await useCase.findByUser('u-1');

    expect(result).toHaveLength(1);
    expect(deviceRepo.findByUser).toHaveBeenCalledWith('u-1');
  });

  it('should upsert a device token', async () => {
    const device = createNotificationDevice({ platform: 'android' });
    deviceRepo.upsert.mockResolvedValue(device);
    const { notificationDeviceId: _id, createdAt: _c, updatedAt: _u, ...params } = device;

    const result = await useCase.upsert(params);

    expect(result?.deviceToken).toBe('token-abc');
    expect(deviceRepo.upsert).toHaveBeenCalledWith(params);
  });

  it('should deactivate a device by token', async () => {
    deviceRepo.deactivate.mockResolvedValue(undefined);

    await useCase.deactivate('token-abc');

    expect(deviceRepo.deactivate).toHaveBeenCalledWith('token-abc');
  });

  it('should delete all devices for the user', async () => {
    deviceRepo.deleteByUser.mockResolvedValue(undefined);

    await useCase.deleteByUser('u-1');

    expect(deviceRepo.deleteByUser).toHaveBeenCalledWith('u-1');
  });
});
