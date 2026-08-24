import { WebhookEndpointEntity } from './WebhookEndpoint';

describe('WebhookEndpointEntity', () => {
  it('should create an endpoint (happy path)', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'My Hook', url: 'https://example.com/hook', events: ['product.created'],
    });
    expect(ep.webhookEndpointId).toBe('we1');
    expect(ep.isActive).toBe(true);
    expect(ep.secret).toHaveLength(64);
    expect(ep.retryPolicy.maxRetries).toBe(5);
  });

  it('should activate and deactivate', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: ['*'],
    });
    ep.deactivate();
    expect(ep.isActive).toBe(false);
    ep.activate();
    expect(ep.isActive).toBe(true);
  });

  it('should update events', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: ['a'],
    });
    ep.updateEvents(['a', 'b']);
    expect(ep.events).toEqual(['a', 'b']);
  });

  it('should update url and name', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: [],
    });
    ep.updateUrl('https://new.com');
    ep.updateName('New Name');
    expect(ep.url).toBe('https://new.com');
    expect(ep.name).toBe('New Name');
  });

  it('should update headers', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: [],
    });
    ep.updateHeaders({ 'X-Custom': 'val' });
    expect(ep.headers).toEqual({ 'X-Custom': 'val' });
  });

  it('should regenerate secret', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: [],
    });
    const old = ep.secret;
    const newSecret = ep.regenerateSecret();
    expect(newSecret).not.toBe(old);
    expect(newSecret).toHaveLength(64);
  });

  it('should subscribe to exact event', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: ['product.created'],
    });
    expect(ep.subscribesToEvent('product.created')).toBe(true);
    expect(ep.subscribesToEvent('order.created')).toBe(false);
  });

  it('should subscribe to wildcard *', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: ['*'],
    });
    expect(ep.subscribesToEvent('anything.happened')).toBe(true);
  });

  it('should subscribe to category wildcard', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: ['product.*'],
    });
    expect(ep.subscribesToEvent('product.created')).toBe(true);
    expect(ep.subscribesToEvent('order.created')).toBe(false);
  });

  it('should serialize to JSON', () => {
    const ep = WebhookEndpointEntity.create({
      webhookEndpointId: 'we1', name: 'Hook', url: 'https://ex.com', events: ['a'],
    });
    const json = ep.toJSON();
    expect(json.webhookEndpointId).toBe('we1');
    expect(json.isActive).toBe(true);
  });
});
