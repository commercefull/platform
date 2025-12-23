/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';
import { knex, Knex } from 'knex';
import { updateTypes, Options } from 'knex-types';

const knexConfig = require('../knexfile');

const OUTPUT_PATH = path.resolve(__dirname, '../libs/db/types.ts');

const resolveEnvironmentConfig = (environment: string): Knex.Config => {
  const config = knexConfig[environment];

  if (!config) {
    throw new Error(`Knex configuration for environment "${environment}" not found.`);
  }

  return config as Knex.Config;
};

async function main(): Promise<void> {
  const environment = process.env.NODE_ENV || 'development';
  const config = resolveEnvironmentConfig(environment);

  const db = knex(config);

  try {
    const options: Options = {
      output: OUTPUT_PATH
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

    await updateTypes(db, options);
    // eslint-disable-next-line no-console
    
  } finally {
    await db.destroy();
  }
}

main().catch(error => {
  // eslint-disable-next-line no-console
  
  process.exit(1);
});
