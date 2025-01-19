import PG from 'pg';

export const pool = new PG.Pool({
  port: parseInt(process.env.POSTGRES_PORT || '', 10),
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20, // maximum number of connections in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
});

export const query = async <T>(text: string, params?: Array<unknown>): Promise<T | null> => {
  let res: PG.QueryResult;

  try {
    if (params !== undefined) {
      res = await pool.query(text, params);
    } else {
      res = await pool.query(text);
    }

  } catch (e) {
    console.error('Error in query', e);
    throw new Error('Query failed')
  }

  if (res.rows.length > 0) {
    return res.rows as unknown as T;
  }

  return null;
}

export const queryOne = async <T>(text: string, params: Array<unknown>): Promise<T | null> => {
  let res: PG.QueryResult;

  try {
    res = await pool.query(text, params);
  } catch (e) {
    console.error('Error in query', e);
    throw new Error('Query failed')
  }

  if (res.rows.length === 1) {
    return res.rows[0] as unknown as T;
  }

  return null;
}