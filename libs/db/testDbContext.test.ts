import { resolveTestDatabase } from './testDbContext';

describe('resolveTestDatabase', () => {
  it('should return the database name when env is development and name matches the test pattern', () => {
    expect(resolveTestDatabase('test_commercefull_dev_abc123def456', 'development')).toBe('test_commercefull_dev_abc123def456');
  });

  it('should return the database name when env is test', () => {
    expect(resolveTestDatabase('test_db_1', 'test')).toBe('test_db_1');
  });

  it('should ignore the header when env is production', () => {
    expect(resolveTestDatabase('test_commercefull_dev_abc', 'production')).toBeUndefined();
  });

  it('should ignore the header when env is staging or unset', () => {
    expect(resolveTestDatabase('test_db', 'staging')).toBeUndefined();
    expect(resolveTestDatabase('test_db', '')).toBeUndefined();
  });

  it('should ignore the header when the name does not follow the test naming scheme', () => {
    expect(resolveTestDatabase('postgres', 'development')).toBeUndefined();
    expect(resolveTestDatabase('commercefull_prod', 'development')).toBeUndefined();
    expect(resolveTestDatabase('test_db;DROP', 'development')).toBeUndefined();
    expect(resolveTestDatabase(`test_${'a'.repeat(100)}`, 'development')).toBeUndefined();
  });

  it('should ignore non-string header values', () => {
    expect(resolveTestDatabase(['test_a', 'test_b'], 'development')).toBeUndefined();
    expect(resolveTestDatabase(undefined, 'development')).toBeUndefined();
  });
});
