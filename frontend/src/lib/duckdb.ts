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

  const partitionedDatasets = [
    'daily_stats',
    'unused_72h',
    'task_stats',
    'deploy_zone_usages',
    'deploy_used_time'
  ];

  // 로드할 타겟 월 배열 (전월, 당월, 익월) - 주차(Week) 조회를 위해 넉넉히 로드
  const targets = [
    { y: month === 1 ? year - 1 : year, m: month === 1 ? 12 : month - 1 },
    { y: year, m: month },
    { y: month === 12 ? year + 1 : year, m: month === 12 ? 1 : month + 1 }
  ];

  // MoM 비교를 위해 작년 동일 월(및 전후)도 로드
  const prevYearTargets = targets.map(t => ({ y: t.y - 1, m: t.m }));
  const allTargets = [...targets, ...prevYearTargets];

  for (const dataset of partitionedDatasets) {
    const urlsToCheck = allTargets.map(t => {
      const file = `${dataset}_${t.y}_${t.m.toString().padStart(2, '0')}.parquet`;
      return { file, url: new URL(`/data/${file}`, window.location.origin).href };
    });

    const checkResults = [];
    const debugInfo = [];
    for (const target of urlsToCheck) {
      try {
        const res = await fetch(target.url, { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        debugInfo.push(`${target.file}:${res.status}(${contentType})`);
        
        // NGINX 등에서 404 대신 index.html을 200으로 내려주는 SPA Fallback을 걸러냅니다.
        if (res.ok && !contentType.includes('text/html')) {
          checkResults.push(target);
        } else {
          checkResults.push(null);
        }
      } catch (e: any) {
        debugInfo.push(`${target.file}:fetch_error(${e.message})`);
        checkResults.push(null);
      }
    }

    const validTargets = checkResults.filter(Boolean);
    if (validTargets.length === 0) {
      throw new Error(`No valid targets found for ${dataset}. Checked: ${debugInfo.join(', ')}`);
    }
    const filesToLoad = [];

    // DB 등록은 순차적으로 실행하여 WebAssembly Worker 레이스 컨디션 방지
    for (const target of validTargets) {
      if (target) {
        await db!.registerFileURL(target.file, target.url, duckdb.DuckDBDataProtocol.HTTP, false);
        filesToLoad.push(`SELECT * FROM '${target.file}'`);
      }
    }

    if (filesToLoad.length > 0) {
       await conn.query(`CREATE OR REPLACE VIEW ${dataset} AS ${filesToLoad.join(' UNION ALL ')};`);
    }
  }
}

export async function getDBConnection() {
  if (!conn || !initialized) {
    await initDuckDB();
  }
  return conn!;
}

export async function getDB() {
  if (!db || !initialized) {
    await initDuckDB();
  }
  return db!;
}
