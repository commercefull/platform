import PG from 'pg';

export const client = new PG.Client({
  port: parseInt(process.env.POSTGRES_PORT || '', 10),
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export const query = async <T>(text: string, params?: Array<unknown>): Promise<T | null> => {
  client.connect();
  let res: PG.QueryResult;

  try {
    if (params !== undefined) {
      res = await client.query(text, params);
    } else {
      res = await client.query(text);
    }
  } catch (e) {
    throw new Error('Query failed');
  } finally {
    client.end();
  }

  if (res.rows.length > 0) {
    return res.rows as unknown as T;
  }

  return null;
};

export const queryOne = async <T>(text: string, params: Array<unknown>): Promise<T | null> => {
  let res: PG.QueryResult;

  try {
    res = await client.query(text, params);
  } catch (e) {
    throw new Error('Query failed');
  } finally {
    client.end();
  }

  if (res.rows.length === 1) {
    return res.rows[0] as unknown as T;
  }

  return null;
};
