import { execFile } from 'child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export const getDbConfig = (): DbConfig => ({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'ecomm-user',
  password: process.env.POSTGRES_PASSWORD || 'ecomm-password',
  database: process.env.POSTGRES_DB || 'ecomm-db',
});

const execPromise = async (
  file: string,
  args: string[] = [],
  envVars: Record<string, string> = {},
): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(file, args, { env: { ...process.env, ...envVars } }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`Error executing ${file}: ${err.message}`));
      }

      const stderrFiltered = stderr
        .split('\n')
        .filter((line) => {
          if (line.match(/^\(node:\d+\)/)) return false;
          if (line.match(/^\(Use `node --trace-/)) return false;
          if (line.match(/^NOTICE:/)) return false;
          if (line.trim() === '') return false;
          return true;
        })
        .join('\n')
        .trim();

      if (stderrFiltered) {
        return reject(new Error(`stderr: ${stderr}`));
      }

      return resolve(stdout);
    });
  });

const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const createDatabase = async (config: DbConfig, databaseName: string): Promise<void> => {
  const args = [
    '-h', config.host,
    '-p', config.port.toString(),
    '-U', config.user,
    '-d', config.database,
    '-c', `CREATE DATABASE "${databaseName}";`,
  ];

  await execPromise('psql', args, { PGPASSWORD: config.password });
  console.log(`Database '${databaseName}' created successfully.`);
};

export const dropDatabase = async (config: DbConfig, databaseName: string): Promise<void> => {
  const args = [
    '-h', config.host,
    '-p', config.port.toString(),
    '-U', config.user,
    '-d', config.database,
    '-c', `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE);`,
  ];

  await execPromise('psql', args, { PGPASSWORD: config.password });
  console.log(`Database '${databaseName}' dropped successfully.`);
};

export const createSnapshot = async (config: DbConfig, dumpDirPath: string): Promise<string> => {
  ensureDirectoryExists(dumpDirPath);

  const dumpFile = path.join(dumpDirPath, `${config.database}.dump`);
  const containerDumpPath = `/tmp/${config.database}.dump`;
  const containerName = process.env.DB_CONTAINER_NAME || 'commerce-db';

  // Use docker exec to run pg_dump inside the container (matching server version)
  await execPromise('docker', [
    'exec',
    containerName,
    'pg_dump',
    '-h', 'localhost',
    '-p', '5432',
    '-U', config.user,
    '-Fc',
    '-d', config.database,
    '-f', containerDumpPath,
  ], { PGPASSWORD: config.password });

  // Copy the dump file from the container to the host
  await execPromise('docker', ['cp', `${containerName}:${containerDumpPath}`, dumpFile]);

  // Clean up the temp file inside the container
  await execPromise('docker', ['exec', containerName, 'rm', '-f', containerDumpPath]);

  console.log(`Snapshot created at ${dumpFile}`);

  return dumpFile;
};

export const restoreSnapshot = async (config: DbConfig, dumpFilePath: string): Promise<void> => {
  const containerDumpPath = `/tmp/${path.basename(dumpFilePath)}`;
  const containerName = process.env.DB_CONTAINER_NAME || 'commerce-db';

  // Copy the dump file into the container
  await execPromise('docker', ['cp', dumpFilePath, `${containerName}:${containerDumpPath}`]);

  // Use docker exec to run pg_restore inside the container (matching server version)
  await execPromise('docker', [
    'exec',
    containerName,
    'pg_restore',
    '-h', 'localhost',
    '-p', '5432',
    '-U', config.user,
    '-d', config.database,
    '--clean',
    '--if-exists',
    '-Fc',
    containerDumpPath,
  ], { PGPASSWORD: config.password });

  // Clean up the temp file inside the container
  await execPromise('docker', ['exec', containerName, 'rm', '-f', containerDumpPath]);

  console.log(`Snapshot restored to '${config.database}' successfully.`);
};

export const runMigrations = async (config: DbConfig): Promise<void> => {
  const args = ['migrate:latest', '--env', 'development'];

  await execPromise('npx', ['knex', ...args], {
    PGPASSWORD: config.password,
    POSTGRES_HOST: config.host,
    POSTGRES_PORT: config.port.toString(),
    POSTGRES_USER: config.user,
    POSTGRES_PASSWORD: config.password,
    POSTGRES_DB: config.database,
    DB_HOST: config.host,
  });

  console.log(`Migrations run on '${config.database}' successfully.`);
};

export const runSeeds = async (config: DbConfig): Promise<void> => {
  const args = ['seed:run', '--env', 'development'];

  await execPromise('npx', ['knex', ...args], {
    PGPASSWORD: config.password,
    POSTGRES_HOST: config.host,
    POSTGRES_PORT: config.port.toString(),
    POSTGRES_USER: config.user,
    POSTGRES_PASSWORD: config.password,
    POSTGRES_DB: config.database,
    DB_HOST: config.host,
  });

  console.log(`Seeds run on '${config.database}' successfully.`);
};
