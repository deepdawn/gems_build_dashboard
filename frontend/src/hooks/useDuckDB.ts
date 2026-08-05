import { useState, useEffect, useCallback } from 'react';
import { getDBConnection, getDB } from '../lib/duckdb';

export function useDuckDB() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDBConnection()
      .then(() => setIsReady(true))
      .catch((err) => setError(err));
  }, []);

  const query = useCallback(async (sql: string) => {
    const db = await getDB();
    const localConn = await db.connect();
    try {
      const result = await localConn.query(sql);
      return result.toArray().map((row: any) => row.toJSON());
    } finally {
      await localConn.close();
    }
  }, []);

  return { isReady, error, query };
}
