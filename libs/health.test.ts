import { createHealthService } from './health';

describe('createHealthService', () => {
  it('should report ready when startup and required dependencies are healthy', async () => {
    const service = createHealthService({
      checkDatabase: jest.fn().mockResolvedValue(undefined),
      checkRedis: jest.fn().mockResolvedValue(undefined),
      requiresRedis: true,
    });
    service.markStarted();

    await expect(service.readiness()).resolves.toMatchObject({ status: 'ok', checks: { startup: 'ok', database: 'ok', redis: 'ok' } });
  });

  it('should report unavailable while draining without probing dependencies', async () => {
    const checkDatabase = jest.fn();
    const service = createHealthService({ checkDatabase, checkRedis: jest.fn(), requiresRedis: false });
    service.markStarted();
    service.startDraining();

    await expect(service.readiness()).resolves.toMatchObject({ status: 'unavailable', checks: { startup: 'draining' } });
    expect(checkDatabase).not.toHaveBeenCalled();
  });

  it('should report unavailable when a required dependency fails', async () => {
    const service = createHealthService({
      checkDatabase: jest.fn().mockRejectedValue(new Error('database unavailable')),
      checkRedis: jest.fn(),
      requiresRedis: false,
    });
    service.markStarted();

    await expect(service.readiness()).resolves.toMatchObject({
      status: 'unavailable',
      checks: { database: 'failed', redis: 'not_required' },
    });
  });
});
