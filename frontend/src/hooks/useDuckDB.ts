import { useState, useEffect } from 'react';
import { getDBConnection } from '../lib/duckdb';

export function useDuckDB() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDBConnection()
      .then(() => setIsReady(true))
      .catch((err) => setError(err));
  }, []);

  const query = async (sql: string) => {
    const conn = await getDBConnection();
    const result = await conn.query(sql);
    return result.toArray().map((row: any) => row.toJSON());
  };

  return { isReady, error, query };
}
