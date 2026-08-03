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
  
  // Register base files
  const baseFiles = [
    'revenue_goal.parquet',
    'deploy_spot.parquet'
  ];

  for (const file of baseFiles) {
    const fileUrl = new URL(`/data/${file}`, window.location.origin).href;
    await db.registerFileURL(file, fileUrl, duckdb.DuckDBDataProtocol.HTTP, false);
    await conn.query(`CREATE OR REPLACE VIEW ${file.split('.')[0]} AS SELECT * FROM '${file}';`);
  }
  
  initialized = true;
  return { db, conn };
}

export async function registerPartitions(year: number, month: number) {
  if (!db || !conn) return;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const partitionedDatasets = [
    'daily_stats',
    'unused_72h',
    'task_stats',
    'deploy_zone_usages',
    'deploy_used_time'
  ];

  for (const dataset of partitionedDatasets) {
    const currFile = `${dataset}_${year}_${month.toString().padStart(2, '0')}.parquet`;
    const prevFile = `${dataset}_${prevYear}_${prevMonth.toString().padStart(2, '0')}.parquet`;

    const filesToLoad = [];
    for (const file of [currFile, prevFile]) {
      try {
        const url = new URL(`/data/${file}`, window.location.origin).href;
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
           await db.registerFileURL(file, url, duckdb.DuckDBDataProtocol.HTTP, false);
           filesToLoad.push(`SELECT * FROM '${file}'`);
        }
      } catch (e) {
        console.warn('Failed to register partition:', file, e);
      }
    }
    
    if (filesToLoad.length > 0) {
       await conn.query(`CREATE OR REPLACE VIEW ${dataset} AS ${filesToLoad.join(' UNION ALL ')};`);
    } else {
       // If no partitions found, create empty view to prevent query crashes
       // We don't know the exact schema, so queries might still fail if they expect specific columns. 
       // This will be caught by the UI try-catch.
    }
  }
}

export async function getDBConnection() {
  if (!conn || !initialized) {
    await initDuckDB();
  }
  return conn!;
}
