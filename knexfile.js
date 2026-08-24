require('dotenv').config({ path: './.env' });

/**
 * Reference data seeds — safe to run in staging.
 * These populate lookup tables the application depends on.
 */
const REFERENCE_DATA_SEEDS = new Set([
  '20240805000201_seedCurrency.js',
  '20240805000204_seedLocale.js',
  '20240805000204_seedProductType.js',
  '20240805000205_seedProductAttributeGroup.js',
  '20240805000206_seedCountry.js',
  '20240805000209_seedTaxCategory.js',
  '20240805000216_seedTaxZone.js',
  '20240805000903_seedContentTypes.js',
  '20240805000904_seedContentBlockTypes.js',
  '20240805000927_seedCurrencyExchangeRates.js',
  '20240805000946_seedInventoryTransactionTypes.js',
  '20240805000957_seedPackagingTypes.js',
  '20240805001204_seedNotificationCategory.js',
  '20241219000014_seedDefaultRoles.js',
  '20241220000011_seedProductDefaults.js',
]);

/**
 * Filter seeds based on environment.
 * - development: all seeds
 * - staging: reference data seeds only
 * - production: no seeds (handled manually)
 */
function getSeedFilter(env) {
  if (env === 'production') {
    return (file) => false; // No seeds in production
  }
  if (env === 'staging') {
    return (file) => REFERENCE_DATA_SEEDS.has(file);
  }
  return (file) => true; // All seeds in development
}

const activeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'commercefull_dev',
    },
    migrations: {
      directory: './migrations',
      tableName: 'knexMigrations',
    },
    seeds: {
      directory: './seeds',
    },
  },

  staging: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'commercefull_staging',
    },
    migrations: {
      directory: './migrations',
      tableName: 'knexMigrations',
    },
    seeds: {
      directory: './seeds',
      loadExtensions: REFERENCE_DATA_SEEDS.size > 0 ? ['.js'] : ['.js'],
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'commercefull_prod',
    },
    migrations: {
      directory: './migrations',
      tableName: 'knexMigrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
