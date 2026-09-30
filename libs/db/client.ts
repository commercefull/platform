import PG from 'pg';
import { mapPgError } from './pool';
import { incrementQueryCounter } from './queryCounter';

/**
 * Serverless (SERVERLESS=1) query path: a single `pg` Client shared for the
 * lifetime of the process. Lambda functions freeze between invocations, so
 * the client is created and connected lazily on first use and never closed.
 */
let client: PG.Client | null = null;
let connectPromise: Promise<PG.Client> | null = null;

const getClient = (): Promise<PG.Client> => {
  if (!connectPromise) {
    client = new PG.Client({
      port: parseInt(process.env.POSTGRES_PORT || '', 10),
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });
    connectPromise = client.connect().then(() => client as PG.Client);
  }
  return connectPromise;
};

export const query = async <T>(text: string, params?: Array<unknown>): Promise<T | null> => {
  let res: PG.QueryResult;

  try {
    const c = await getClient();
    incrementQueryCounter(text);
    res = await c.query(text, params);
  } catch (e: unknown) {
    throw mapPgError(e);
  }

  if (res.rows.length > 0) {
    return res.rows as unknown as T;
  }

  return null;
};

export const queryOne = async <T>(text: string, params: Array<unknown>): Promise<T | null> => {
  let res: PG.QueryResult;

  try {
    const c = await getClient();
    incrementQueryCounter(text);
    res = await c.query(text, params);
  } catch (e: unknown) {
    throw mapPgError(e);
  }

  if (res.rows.length === 1) {
    return res.rows[0] as unknown as T;
  }

  return null;
};
