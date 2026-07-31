import * as duckdb from '@duckdb/duckdb-wasm';

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let initialized = false;

export async function initDuckDB() {
  if (db && conn && initialized) return { db, conn };

  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  
  // Instantiate the asynchronus version of DuckDB-wasm
  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {type: 'text/javascript'})
  );
  
  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);
  
  conn = await db.connect();
  
  // Register files
  const files = [
    'revenue_goal.parquet',
    'daily_stats.parquet',
    'deploy_spot.parquet',
    'unused_72h.parquet',
    'task_stats.parquet'
  ];

  for (const file of files) {
    // We register the URL directly. The path will be /data/...
    await db.registerFileURL(file, `/data/${file}`, duckdb.DuckDBDataProtocol.HTTP, false);
    // Create views for easier querying
    await conn.query(`CREATE OR REPLACE VIEW ${file.split('.')[0]} AS SELECT * FROM '${file}';`);
  }
  
  initialized = true;
  return { db, conn };
}

export async function getDBConnection() {
  if (!conn || !initialized) {
    await initDuckDB();
  }
  return conn!;
}
