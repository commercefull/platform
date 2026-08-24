import { Organization } from './Organization';

describe('Organization', () => {
  const baseProps = {
    organizationId: 'o1', name: 'Acme Corp', code: 'ACME', email: 'info@acme.com',
  };

  it('should create an organization (happy path)', () => {
    const org = Organization.create(baseProps);
    expect(org.organizationId).toBe('o1');
    expect(org.name).toBe('Acme Corp');
    expect(org.status).toBe('pending');
    expect(org.isActive).toBe(false);
  });

  it('should activate', () => {
    const org = Organization.create(baseProps);
    org.activate();
    expect(org.isActive).toBe(true);
    expect(org.status).toBe('active');
  });

  it('should suspend', () => {
    const org = Organization.create(baseProps);
    org.activate();
    org.suspend();
    expect(org.status).toBe('suspended');
    expect(org.isActive).toBe(false);
  });

  it('should deactivate', () => {
    const org = Organization.create(baseProps);
    org.activate();
    org.deactivate();
    expect(org.status).toBe('inactive');
  });

  it('should serialize to JSON', () => {
    const org = Organization.create({ ...baseProps, phone: '555-1234' });
    const json = org.toJSON();
    expect(json.organizationId).toBe('o1');
    expect(json.phone).toBe('555-1234');
  });
});
