require('dotenv').config({ path: './.env' });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'commercefull_dev',
    },
    migrations: {
      directory: './migrations_knex',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  staging: {
    client: 'pg',
    connection: process.env.STAGING_DATABASE_URL,
    migrations: {
      directory: './migrations_knex',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations_knex',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};
