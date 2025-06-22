// // etl/load.js
// /* eslint-disable no-console */
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { config } from 'dotenv';
// import pg from 'pg';
// import fetch from 'node-fetch';

// import { fetchOCM } from './fetchOCM.js';
// import { fetchOSM } from './fetchOSM.js';
// import { fetchEAmrit } from './fetchEAmrit.js';

// /* ------------------------------------------------------------------ */
// /* 0 Load environment variables                                       */
// /* ------------------------------------------------------------------ */
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// config({ path: path.resolve(__dirname, '../.env') });

// const { DATABASE_URL } = process.env;
// if (!DATABASE_URL) throw new Error('DATABASE_URL missing in .env');
// if (!process.env.OCM_KEY) console.warn('⚠️  OCM_KEY missing — OCM fetch may fail');

// /* ------------------------------------------------------------------ */
// /* 1 Fetch all feeds                                                  */
// /* ------------------------------------------------------------------ */
// console.time('fetch');
// const rows = [
//   ...(await fetchOCM()),
//   ...(await fetchOSM()),
//   ...(await fetchEAmrit()),
//   // ...(await fetchEAmrit()),   // add later
//   // ...(await fetchTata()),     // add later
// ];
// console.timeEnd('fetch');
// console.log('raw rows', rows.length);

// /* ------------------------------------------------------------------ */
// /* 2 Deduplicate by rounded lat-lon                                   */
// /* ------------------------------------------------------------------ */
// const map = new Map(); // key => merged record

// function gridKey(lat, lon) {
//   return `${lat.toFixed(3)},${lon.toFixed(3)}`; // ≈ 110 m
// }

// for (const r of rows) {
//   const k = gridKey(r.lat, r.lon);
//   if (!map.has(k)) {
//     map.set(k, r);
//   } else {
//     const old = map.get(k);
//     map.set(k, {
//       ...old,
//       // Prefer non-null fields from the new record
//       network: old.network ?? r.network,
//       cost:    old.cost    ?? r.cost,
//       status:  old.status  ?? r.status,
//       // Merge connector arrays
//       connections: [...old.connections, ...r.connections],
//     });
//   }
// }
// const deduped = [...map.values()];
// console.log('unique rows', deduped.length);

// /* ------------------------------------------------------------------ */
// /* 3 Insert into Supabase/Postgres                                    */
// /* ------------------------------------------------------------------ */
// const pool = new pg.Pool({ connectionString: DATABASE_URL });
// const client = await pool.connect();

// try {
//   console.time('sql');
//   await client.query('BEGIN');
//   await client.query('TRUNCATE ev_stations');
//   const text = `INSERT INTO ev_stations
//     (id, source, name, network, cost, status, connections,
//      geom, lat, lon, address, city, state)
//     VALUES
//     ($1,$2,$3,$4,$5,$6,$7, ST_SetSRID(ST_MakePoint($8,$9),4326),
//      $8,$9,$10,$11,$12)`;

//   for (const r of deduped) {
//     await client.query(text, [
//       r.id, r.source, r.name, r.network, r.cost, r.status,
//       JSON.stringify(r.connections),
//       r.lon, r.lat, r.address, r.city, r.state,
//     ]);
//   }
//   await client.query('COMMIT');
//   console.timeEnd('sql');
//   console.log('Loaded', deduped.length, 'stations ✔');
// } catch (err) {
//   await client.query('ROLLBACK');
//   console.error(err);
//   process.exitCode = 1;
// } finally {
//   client.release();
//   pool.end();
// }
// etl/load.js
/* eslint-disable no-console */
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { config } from 'dotenv';
// import pg from 'pg';
// import fetch from 'node-fetch';

// import { fetchOCM }    from './fetchOCM.js';
// import { fetchOSM }    from './fetchOSM.js';
// import { fetchEAmrit } from './fetchEAmrit.js';
// import { fetchBeeYatra } from './fetchBeeYatra.js';

// /* ------------------------------------------------------------------ */
// /* 0 Env setup                                                        */
// /* ------------------------------------------------------------------ */
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// config({ path: path.resolve(__dirname, '../.env') });

// const { DATABASE_URL } = process.env;
// if (!DATABASE_URL) throw new Error('DATABASE_URL missing in .env');

// /* ------------------------------------------------------------------ */
// /* 1 Fetch feeds                                                      */
// /* ------------------------------------------------------------------ */
// console.time('fetch');
// const rows = [
//   ...(await fetchOCM()),      // 1 000 rows (first page only)
//   ...(await fetchOSM()),      // ≈300
//   ...(await fetchEAmrit()),
//   ...(await fetchBeeYatra())   // ≈4 000
// ];
// console.timeEnd('fetch');
// console.log('raw rows', rows.length);

// /* ------------------------------------------------------------------ */
// /* 2 Deduplicate                                                      */
// /* ------------------------------------------------------------------ */
// const map = new Map();           // key -> merged record
// const gridKey = (lat, lon) => `${lat.toFixed(3)},${lon.toFixed(3)}`; // ~110 m

// for (const r of rows) {
//   const k = gridKey(r.lat, r.lon);
//   if (!map.has(k)) map.set(k, r);
//   else {
//     const old = map.get(k);
//     map.set(k, {
//       ...old,
//       network:  old.network  ?? r.network,
//       cost:     old.cost     ?? r.cost,
//       status:   old.status   ?? r.status,
//       connections: [...old.connections, ...r.connections],
//     });
//   }
// }
// const deduped = [...map.values()];
// console.log('unique rows', deduped.length);

// /* ------------------------------------------------------------------ */
// /* 3 Insert with UPSERT                                               */
// /* ------------------------------------------------------------------ */
// const pool = new pg.Pool({
//   connectionString: DATABASE_URL,
//   ssl: { rejectUnauthorized: false },     // Supabase requires SSL
// });
// const client = await pool.connect();

// try {
//   console.time('sql');
//   await client.query('BEGIN');
//   await client.query('TRUNCATE ev_stations');

//   const text = `INSERT INTO ev_stations
//     (id, source, name, network, cost, status, connections,
//      geom, lat, lon, address, city, state)
//     VALUES
//     ($1,$2,$3,$4,$5,$6,$7,
//      ST_SetSRID(ST_MakePoint($8,$9),4326),
//      $8,$9,$10,$11,$12)
//     ON CONFLICT (id) DO NOTHING`;

//   for (const r of deduped) {
//     await client.query(text, [
//       r.id, r.source, r.name, r.network, r.cost, r.status,
//       JSON.stringify(r.connections),
//       r.lon, r.lat, r.address, r.city, r.state,
//     ]);
//   }
//   await client.query('COMMIT');
//   console.timeEnd('sql');
//   console.log('Loaded', deduped.length, 'stations ✔');
// } catch (err) {
//   await client.query('ROLLBACK');
//   console.error(err);
//   process.exitCode = 1;
// } finally {
//   client.release();
//   pool.end();
// }
/* eslint-disable no-console ------------------------------------------------- */
/* 0 · ENV & SET-UP ---------------------------------------------------------- */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL missing in .env');

console.log('🗄️  Supabase URL:', DATABASE_URL.split('@')[1].split(':')[0]);
process.env.OCM_KEY
  ? console.log('🔑  OCM key present')
  : console.warn('⚠️  OCM_KEY missing – OCM feed limited to 1 000 rows');

/* 1 · FETCH ALL FEEDS ------------------------------------------------------- */
import { fetchOCM }      from './fetchOCM.js';
import { fetchOSM }      from './fetchOSM.js';
import { fetchEAmrit }   from './fetchEAmrit.js';
import { fetchBeeYatra } from './fetchBeeYatra.js';
import { fetchStatiq }   from './fetchStatiq.js'
//import { fetchTata }     from './fetchTata.js';

console.time('fetch');
const rows = [
  ...(await fetchOCM()),
  ...(await fetchOSM()),
  ...(await fetchEAmrit()),
  ...(await fetchBeeYatra()),
  ...(await fetchStatiq()),
  //...(await fetchTata())
];
console.timeEnd('fetch');
console.log(`📥 Fetched raw rows: ${rows.length}`);

/* 2 · DEDUPE (100 m grid) --------------------------------------------------- */
const grid = new Map();
for (const r of rows) {
  if (!r.lat || !r.lon) continue;                           // skip junk rows
  const k = `${r.lat.toFixed(3)},${r.lon.toFixed(3)}`;
  if (!grid.has(k)) grid.set(k, r);
  else {
    const a = grid.get(k), b = r;
    grid.set(k, {
      ...a,
      network: a.network ?? b.network,
      cost:    a.cost    ?? b.cost,
      status:  a.status  ?? b.status,
      connections: [...a.connections, ...b.connections],
    });
  }
}
const unique = [...grid.values()];
console.log(`🧹 Unique rows after dedupe: ${unique.length}`);

/* 3 · DB CONNECT & INSERT --------------------------------------------------- */
console.log('🔌 Connecting to Supabase…');
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const client = await pool.connect();
console.log('✅ DB connection established');

try {
  console.time('sql');
  console.log('🚮 Truncating ev_stations…');
  await client.query('BEGIN');
  await client.query('TRUNCATE ev_stations');

  const stmt = `
    INSERT INTO ev_stations
      (id, source, name, network, cost, status, connections,
       geom, lat, lon, address, city, state)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,
       ST_SetSRID(ST_MakePoint($8,$9),4326),
       $8,$9,$10,$11,$12)
    ON CONFLICT (id) DO NOTHING`;

  let inserted = 0;
  for (const r of unique) {
    await client.query(stmt, [
      r.id, r.source, r.name, r.network, r.cost, r.status,
      JSON.stringify(r.connections),
      r.lon, r.lat, r.address, r.city, r.state,
    ]);
    if (++inserted % 5000 === 0) console.log(`…inserted ${inserted} rows`);
  }

  await client.query('COMMIT');
  console.timeEnd('sql');
  console.log(`🆗 Insert committed — total rows inserted: ${inserted}`);
} catch (err) {
  await client.query('ROLLBACK');
  console.error('❌ SQL error, rolled back:', err.message);
  process.exitCode = 1;
} finally {
  client.release();
  pool.end();
  console.log('🔚 DB connection closed');
}
