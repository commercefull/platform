import { SalesChannel } from './SalesChannel';
import { StoreValidationError } from '../errors/StoreErrors';

describe('SalesChannel', () => {
  it('should normalize the code when a sales channel is created', () => {
    const channel = SalesChannel.create({
      salesChannelId: 'channel-1',
      organizationId: 'org-1',
      code: ' Facebook Shop ',
      name: 'Facebook Shop',
      type: 'social',
    });

    expect(channel.code).toBe('facebook-shop');
    expect(channel.status).toBe('active');
  });

  it('should reject an unsupported sales channel type', () => {
    expect(() =>
      SalesChannel.create({
        salesChannelId: 'channel-1',
        organizationId: 'org-1',
        code: 'website',
        name: 'Website',
        type: 'unsupported' as never,
      }),
    ).toThrow(StoreValidationError);
  });

  it('should update mutable channel settings', () => {
    const channel = SalesChannel.create({
      salesChannelId: 'channel-1',
      organizationId: 'org-1',
      code: 'website',
      name: 'Website',
      type: 'web',
    });

    channel.update({ name: 'Main Website', status: 'inactive', config: { locale: 'en-US' } });

    expect(channel.name).toBe('Main Website');
    expect(channel.status).toBe('inactive');
    expect(channel.config).toEqual({ locale: 'en-US' });
  });
});
