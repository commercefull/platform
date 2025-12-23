require('dotenv').config({ path: './.env' });

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

  production: {
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
};
