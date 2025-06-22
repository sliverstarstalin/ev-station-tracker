// etl/fetchEAmrit.js  – robust paged JSON, no mirror needed
import fetch from 'node-fetch';
import { Agent } from 'https';

const LIVE_URL = 'https://e-amrit.niti.gov.in/getChargingStation';
const PAGE_SIZE = 160;
const MAX_PAGES = 100;          // safety-cap -> 16 000 rows

function makeId(prefix, rec) {
  return rec.id
    ? `${prefix}_${rec.id}`
    : `${prefix}_${rec.latitude}_${rec.longitude}`;
}

function normalise(r) {
  return {
    id:      makeId('EA', r),
    source:  'EAMRIT',
    name:    r.station_name,
    network: r.operator_name,
    cost:    r.charging_cost || null,
    status:  'unknown',
    connections: [{ type: r.charging_type, powerKW: null, qty: 1 }],
    lat: +r.latitude,
    lon: +r.longitude,
    address: r.address,
    city:    r.city,
    state:   r.state,
  };
}

export async function fetchEAmrit() {
  const agent = new Agent({ rejectUnauthorized: false }); // bypass CA issue
  const rows  = [];
  const seenIds = new Set();

  let page = 1;
  let previousFirstName = null;

  while (page <= MAX_PAGES) {
    const url  = `${LIVE_URL}?page=${page}`;
    const resp = await fetch(url, { agent });
    if (!resp.ok) throw new Error(`e-AMRIT HTTP ${resp.status} on page ${page}`);

    const batch = await resp.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    // stop if server starts repeating the same slice
    const firstName = batch[0]?.station_name ?? '';
    if (firstName === previousFirstName) {
      console.warn(`e-AMRIT page ${page} repeats – assuming end of list`);
      break;
    }
    previousFirstName = firstName;

    // push only new IDs
    for (const r of batch) {
      const id = makeId('EA', r);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        rows.push(normalise(r));
      }
    }

    console.log(`e-AMRIT page ${page}: ${batch.length} rows`);
    if (batch.length < PAGE_SIZE) break; // natural last page
    page += 1;
  }

  console.log(`e-AMRIT total unique: ${rows.length} rows across ${page} page(s)`);
  return rows;
}
