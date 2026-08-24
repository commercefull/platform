import {
  ConfigurationNotFoundError, InvalidConfigurationValueError, ConfigurationKeyRequiredError,
  ConfigurationValidationError,
} from './ConfigurationErrors';

describe('ConfigurationErrors', () => {
  it('ConfigurationNotFoundError', () => { expect(new ConfigurationNotFoundError('key1').statusCode).toBe(404); });
  it('InvalidConfigurationValueError', () => { expect(new InvalidConfigurationValueError('key1', 'bad').statusCode).toBe(400); });
  it('ConfigurationKeyRequiredError', () => { expect(new ConfigurationKeyRequiredError().statusCode).toBe(400); });
  it('ConfigurationValidationError', () => { expect(new ConfigurationValidationError('bad').statusCode).toBe(400); });
});
